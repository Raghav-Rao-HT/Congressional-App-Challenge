import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

// CLIENT <-> RULES CONTRACT.
// firestore.rules.test.ts proves the rules with hand-written payloads. This file proves the app's REAL
// data-layer functions (src/lib/firestore/*) are accepted by those same rules, end to end, and that the
// same real functions are refused when an attacker calls them. If someone changes a payload in the client
// or tightens a rule, this is the test that notices the two have drifted apart.

const holder = vi.hoisted(() => ({ db: null as unknown }))
vi.mock('../src/lib/firebase', () => ({
  get db() {
    return holder.db
  },
  auth: {},
  app: {},
}))

import { approveOrganization, applyToOrganization, createOrganization, rejectOrganization, setMemberStatus, verifyApprovedOrganization } from '../src/lib/firestore/organizations'
import { createBulletinPost } from '../src/lib/firestore/bulletinPosts'
import { ensureMyContact, subscribeAllContacts } from '../src/lib/firestore/contacts'
import { lookupFriendCode, sendFriendRequest, respondToFriendRequest } from '../src/lib/firestore/friendships'
import { issueJoinCode, JoinCodeError, joinWithCode, subscribeOrgJoinCodes, turnOffJoinCode } from '../src/lib/firestore/joinCodes'
import { formatCode } from '../src/lib/codes'
import { createGoal } from '../src/lib/firestore/goals'
import {
  approveHourLog,
  awardHours,
  rejectHourLog,
  sendReplyImage,
  submitAutoApprovedHourLog,
  submitHourLog,
} from '../src/lib/firestore/hourLogs'
import { decideRsvp, rsvpToPost } from '../src/lib/firestore/rsvps'
import { createUserProfile } from '../src/lib/firestore/users'

let env: RulesTestEnvironment

const ADMIN = 'admin1'
const OFFICER = 'officer1'
const VOL = 'volunteer1'
const VOL2 = 'volunteer2'
const FRIEND = 'friend1'
const TEST = 'testUser'
const OUTSIDER = 'outsider'

const jpeg = 'data:image/jpeg;base64,' + 'A'.repeat(20_000)
const png = 'data:image/png;base64,' + 'A'.repeat(5_000)
const addr = { street: '1 Main St', city: 'Newark', state: 'NJ', zip: '07101' }

/** Run `fn` as `uid`: the real data-layer functions pick the signed-in user's Firestore up from here. */
async function as<T>(uid: string, fn: () => Promise<T>): Promise<T> {
  holder.db = env.authenticatedContext(uid, { email: `${uid}@x.test`, email_verified: true }).firestore()
  return fn()
}

const orgInput = (uid: string, extra: Record<string, unknown> = {}) => ({
  submittedByUid: uid,
  submittedByDisplayName: `User ${uid}`,
  name: 'Paws Rescue',
  legalName: 'Paws Rescue Inc',
  address: addr,
  location: { lat: 40.7, lng: -74.1 },
  contactEmail: 'hello@paws.org',
  contactPhone: '5551234567',
  website: 'https://paws.org',
  causeArea: 'Animals',
  nonprofitType: null,
  irsClassification: null,
  ein: '12-3456789',
  ...extra,
})

async function readAs(uid: string, path: [string, ...string[]]) {
  const f = env.authenticatedContext(uid, { email: `${uid}@x.test`, email_verified: true }).firestore()
  return (await getDoc(doc(f, ...path))).data()
}
async function readAdmin(path: [string, ...string[]]) {
  let data: Record<string, unknown> | undefined
  await env.withSecurityRulesDisabled(async (c) => {
    data = (await getDoc(doc(c.firestore(), ...path))).data()
  })
  return data
}

let orgId = ''
let pendingLogId = ''
let rejectedOrgId = ''

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-vetwork-contract',
    firestore: { rules: readFileSync(resolve(__dirname, '../firestore.rules'), 'utf8') },
  })
  await env.clearFirestore()
  await env.withSecurityRulesDisabled(async (c) => {
    const f = c.firestore()
    const base = {
      email: '', displayName: '', homeState: 'NJ', ageBand: '18+', nonprofitType: null, irsClassification: null,
      orgId: null, totalPoints: 0, totalHoursApproved: 0, currentStreakWeeks: 0, longestStreakWeeks: 0,
      lastServiceDate: null, createdAt: 1, lastActiveAt: 1,
    }
    await setDoc(doc(f, 'users', ADMIN), { ...base, uid: ADMIN, email: 'a@x.test', displayName: 'Admin', accountType: 'admin' })
    await setDoc(doc(f, 'users', TEST), { ...base, uid: TEST, email: 't@x.test', displayName: 'Tess Test', accountType: 'organization_officer', isTestAccount: true })
  })
})
afterAll(async () => {
  await env.cleanup()
})

describe('the real client functions are accepted by the rules (the whole story, in order)', () => {
  it('signup: createUserProfile for a volunteer, an officer and friends', async () => {
    await assertSucceeds(as(OFFICER, () => createUserProfile({ uid: OFFICER, email: `${OFFICER}@x.test`, displayName: 'Olive Officer', homeState: 'NJ', accountType: 'organization_officer', ageBand: '18+', nonprofitType: 'Animal welfare', irsClassification: '501(c)(3)' })))
    for (const uid of [VOL, VOL2, FRIEND, OUTSIDER]) {
      await assertSucceeds(as(uid, () => createUserProfile({ uid, email: `${uid}@x.test`, displayName: `Person ${uid}`, homeState: 'NJ', accountType: 'member', ageBand: '13-17' })))
    }
  })

  it('createOrganization submits a pending org with an EIN and makes the creator its officer', async () => {
    orgId = await as(OFFICER, () => createOrganization(orgInput(OFFICER)))
    expect(orgId).toBeTruthy()
    expect((await readAdmin(['organizations', orgId]))?.status).toBe('pending')
  })

  it('a pending org cannot yet admit volunteers or vouch for hours', async () => {
    await as(VOL, () => applyToOrganization({ orgId, uid: VOL, displayName: 'Vee Volunteer' }))
    await assertFails(as(OFFICER, () => setMemberStatus({ orgId, memberUid: VOL, status: 'approved', reviewerUid: OFFICER })))
  })

  it('approveOrganization needs the IRS stamp and then links the submitter', async () => {
    await assertSucceeds(
      as(ADMIN, () => approveOrganization({ orgId, submittedByUid: OFFICER, adminUid: ADMIN, ein: '12-3456789', verificationSource: 'IRS TEOS: 501(c)(3), active' })),
    )
    const org = await readAdmin(['organizations', orgId])
    expect(org).toMatchObject({ status: 'approved', ein: '12-3456789', irsVerifiedByUid: ADMIN })
    expect((await readAdmin(['users', OFFICER]))?.orgId).toBe(orgId)
  })

  it('applyToOrganization + setMemberStatus admit a volunteer once the org is approved', async () => {
    await assertSucceeds(as(VOL, () => applyToOrganization({ orgId, uid: VOL, displayName: 'Vee Volunteer' })))
    await assertSucceeds(as(OFFICER, () => setMemberStatus({ orgId, memberUid: VOL, status: 'approved', reviewerUid: OFFICER })))
  })

  it('createGoal accepts normal goals', async () => {
    await assertSucceeds(as(VOL, () => createGoal({ uid: VOL, orgId: null, targetHours: 5, periodStart: '2026-11-01', periodEnd: '2026-12-31' })))
    await assertSucceeds(as(VOL, () => createGoal({ uid: VOL, orgId, targetHours: 12, periodStart: '2026-11-01', periodEnd: '2026-12-31' })))
  })

  it('submitHourLog accepts a pending log with a photo', async () => {
    await assertSucceeds(as(VOL, () => submitHourLog({ memberUid: VOL, orgId, petId: 'fox', date: '2026-11-02', hours: 3, description: 'Walked the shelter dogs', attachment: jpeg })))
    const logs = await as(OFFICER, async () =>
      getDocs(query(collection(holder.db as never, 'hourLogs'), where('orgId', '==', orgId), where('status', '==', 'pending'))),
    )
    expect(logs.size).toBe(1)
    pendingLogId = logs.docs[0].id
  })

  it('approveHourLog: the officer’s real multi-document transaction (log, member, user, pet, goals)', async () => {
    await assertSucceeds(
      as(OFFICER, () => approveHourLog({ logId: pendingLogId, orgId, memberUid: VOL, petId: 'fox', hours: 3, date: '2026-11-02', reviewerUid: OFFICER, signatureDataUrl: png })),
    )
    const user = await readAdmin(['users', VOL])
    expect(user?.totalHoursApproved).toBe(3)
    expect(user?.totalPoints as number).toBeGreaterThanOrEqual(30)
    expect((await readAdmin(['hourLogs', pendingLogId]))?.status).toBe('approved')
    expect((await readAdmin(['users', VOL, 'pets', 'fox']))?.xp).toBe(3)
  })

  it('rejectHourLog and sendReplyImage', async () => {
    await as(VOL, () => submitHourLog({ memberUid: VOL, orgId, petId: 'fox', date: '2026-11-03', hours: 1, description: 'Cleaned kennels', attachment: jpeg }))
    const q = await as(OFFICER, async () => getDocs(query(collection(holder.db as never, 'hourLogs'), where('orgId', '==', orgId), where('status', '==', 'pending'))))
    const id = q.docs[0].id
    await assertSucceeds(as(OFFICER, () => sendReplyImage(id, jpeg)))
    await assertSucceeds(as(OFFICER, () => rejectHourLog({ logId: id, reviewerUid: OFFICER, reason: 'Rejected by organization' })))
  })

  it('awardHours enrolls and credits a volunteer who has not joined yet', async () => {
    await assertSucceeds(as(OFFICER, () => awardHours({ orgId, officerUid: OFFICER, memberUid: VOL2, memberName: 'Person volunteer2', date: '2026-11-04', hours: 2, description: 'Event staffing' })))
    expect((await readAdmin(['organizations', orgId, 'members', VOL2]))?.status).toBe('approved')
    expect((await readAdmin(['users', VOL2]))?.totalHoursApproved).toBe(2)
  })

  it('friend request and acceptance', async () => {
    await assertSucceeds(as(VOL, () => sendFriendRequest(VOL, FRIEND)))
    await assertSucceeds(as(FRIEND, () => respondToFriendRequest({ fromUid: VOL, toUid: FRIEND, accept: true })))
  })

  it('events: a member post, an org post, RSVP and decision', async () => {
    const when = { startAt: Date.now(), endAt: Date.now() + 86_400_000, location: { address: '1 Main', city: 'Newark', state: 'NJ' }, tags: ['food'], description: 'Bring gloves', offersServiceHours: true }
    await assertSucceeds(as(VOL, () => createBulletinPost({ authorUid: VOL, authorType: 'member', orgId: null, audience: 'public', title: 'Beach cleanup', ...when })))
    await assertSucceeds(as(OFFICER, () => createBulletinPost({ authorUid: OFFICER, authorType: 'org', orgId, audience: 'members', title: 'Kennel day', ...when })))

    const posts = await as(ADMIN, async () => getDocs(collection(holder.db as never, 'bulletinPosts')))
    const memberPost = posts.docs.find((d) => d.data().authorUid === VOL)!
    await assertSucceeds(as(FRIEND, () => rsvpToPost({ postId: memberPost.id, uid: FRIEND, displayName: 'Person friend1' })))
    await assertSucceeds(as(VOL, () => decideRsvp({ postId: memberPost.id, rsvpUid: FRIEND, status: 'approved' })))
    expect((await readAdmin(['bulletinPosts', memberPost.id]))?.approvedCount).toBe(1)
  })

  let testOrg = ''
  it('test accounts: createOrganization auto-approves and adopts the org', async () => {
    testOrg = await as(TEST, () => createOrganization(orgInput(TEST, { name: 'Demo Org', autoApprove: true })))
    expect(testOrg).toBeTruthy()
    expect((await readAdmin(['users', TEST]))?.orgId).toBe(testOrg)
  })

  it('test accounts: applyToOrganization auto-approves membership', async () => {
    await assertSucceeds(as(TEST, () => applyToOrganization({ orgId, uid: TEST, displayName: 'Tess Test', autoApprove: true })))
  })

  it('test accounts: submitAutoApprovedHourLog self-approves hours', async () => {
    await assertSucceeds(as(TEST, () => submitAutoApprovedHourLog({ memberUid: TEST, orgId, petId: 'fox', date: '2026-11-05', hours: 2, description: 'Demo shift' })))
  })

  it('admin can reject a pending org and retro-verify an older approved one', async () => {
    const pending = await as(OUTSIDER, () => createOrganization(orgInput(OUTSIDER, { name: 'Shady Org', ein: '98-7654321' })))
    rejectedOrgId = pending
    await assertSucceeds(as(ADMIN, () => rejectOrganization({ orgId: pending, adminUid: ADMIN, reason: 'Could not confirm 501(c)(3) status' })))
    await env.withSecurityRulesDisabled((c) => setDoc(doc(c.firestore(), 'organizations', 'legacyOrg'), {
      orgId: 'legacyOrg', name: 'Old Org', legalName: 'Old Org', address: addr, contactEmail: 'a@b.org', contactPhone: '555', website: '', causeArea: 'x', status: 'approved', submittedByUid: 'x', createdAt: 1, memberCount: 1,
    }))
    await assertSucceeds(as(ADMIN, () => verifyApprovedOrganization({ orgId: 'legacyOrg', adminUid: ADMIN, ein: '11-2223334', verificationSource: 'IRS TEOS' })))
  })
})

describe('the SAME real functions are refused when an attacker calls them', () => {
  it('a volunteer cannot run the officer’s approveHourLog on their own log', async () => {
    await as(VOL, () => submitHourLog({ memberUid: VOL, orgId, petId: 'fox', date: '2026-11-06', hours: 5, description: 'Totally real hours', attachment: null }))
    const q = await as(VOL, async () => getDocs(query(collection(holder.db as never, 'hourLogs'), where('memberUid', '==', VOL), where('status', '==', 'pending'))))
    const id = q.docs[0].id
    await assertFails(as(VOL, () => approveHourLog({ logId: id, orgId, memberUid: VOL, petId: 'fox', hours: 5, date: '2026-11-06', reviewerUid: VOL, signatureDataUrl: png })))
    expect((await readAdmin(['hourLogs', id]))?.status).toBe('pending')
  })

  it('an outsider officer cannot award hours into an org they do not officiate', async () => {
    await assertFails(as(OUTSIDER, () => awardHours({ orgId, officerUid: OUTSIDER, memberUid: FRIEND, memberName: 'Person friend1', date: '2026-11-04', hours: 24, description: 'free hours' })))
    expect((await readAdmin(['users', FRIEND]))?.totalHoursApproved).toBe(0)
  })

  it('submitHourLog refuses absurd hours and other orgs', async () => {
    await assertFails(as(VOL, () => submitHourLog({ memberUid: VOL, orgId, petId: 'fox', date: '2026-11-07', hours: 5000, description: 'lots', attachment: null })))
    await assertFails(as(OUTSIDER, () => submitHourLog({ memberUid: OUTSIDER, orgId, petId: 'fox', date: '2026-11-07', hours: 2, description: 'not a member', attachment: null })))
  })

  it('createGoal refuses farm-sized goals', async () => {
    await assertFails(as(VOL, () => createGoal({ uid: VOL, orgId: null, targetHours: 0.25, periodStart: '2026-11-01', periodEnd: '2026-11-02' })))
  })

  it('sendFriendRequest cannot be used to befriend yourself or fake the requester', async () => {
    await assertFails(as(OUTSIDER, () => sendFriendRequest(OUTSIDER, OUTSIDER)))
    await assertFails(as(OUTSIDER, () => sendFriendRequest(VOL, FRIEND)))
  })

  it('createBulletinPost cannot impersonate an org, and a pending org’s officer cannot post as it', async () => {
    const when = { startAt: Date.now(), endAt: Date.now() + 1000, location: { address: '', city: 'x', state: 'NJ' }, tags: [] as string[], description: '', offersServiceHours: true }
    await assertFails(as(OUTSIDER, () => createBulletinPost({ authorUid: OUTSIDER, authorType: 'member', orgId, audience: 'public', title: 'Official Paws event', ...when })))
    await assertFails(as(OUTSIDER, () => createBulletinPost({ authorUid: OUTSIDER, authorType: 'org', orgId, audience: 'public', title: 'Official Paws event', ...when })))
  })

  it('createOrganization cannot skip the EIN or self-approve', async () => {
    await assertFails(as(OUTSIDER, () => createOrganization(orgInput(OUTSIDER, { ein: 'not-an-ein' }))))
    await assertFails(as(OUTSIDER, () => createOrganization(orgInput(OUTSIDER, { autoApprove: true }))))
  })

  it('approveOrganization is admin-only', async () => {
    const pending = await as(OUTSIDER, () => createOrganization(orgInput(OUTSIDER, { name: 'Another Org' })))
    await assertFails(as(OUTSIDER, () => approveOrganization({ orgId: pending, submittedByUid: OUTSIDER, adminUid: OUTSIDER, ein: '12-3456789', verificationSource: 'self' })))
    await assertFails(as(OFFICER, () => approveOrganization({ orgId: pending, submittedByUid: OUTSIDER, adminUid: OFFICER, ein: '12-3456789', verificationSource: 'friend' })))
  })

  it('the signed-up officer’s profile starts clean and cannot be bumped by the client’s own signup path', async () => {
    await assertFails(
      as('latecomer', async () => {
        const f = holder.db as never
        await setDoc(doc(f, 'users', 'latecomer'), {
          uid: 'latecomer', email: 'latecomer@x.test', displayName: 'Late Comer', homeState: 'NJ', accountType: 'member', ageBand: '18+',
          orgId: null, totalPoints: 99999, totalHoursApproved: 0, currentStreakWeeks: 0, longestStreakWeeks: 0, lastServiceDate: null, createdAt: 1, lastActiveAt: 1,
        })
      }),
    )
  })
})


const CODE_RE = /^[A-HJ-NP-Z2-9]{8}$/
const once = <T>(subscribe: (resolve: (v: T) => void, reject: (e: Error) => void) => () => void) =>
  new Promise<T>((resolve, reject) => {
    const unsubscribe = subscribe(
      (value) => {
        unsubscribe()
        resolve(value)
      },
      (error) => reject(error),
    )
  })

describe('privacy split and friend codes, through the real client functions', () => {
  it('signup kept the email off the public profile and issued a friend code', async () => {
    expect(await readAdmin(['users', VOL])).not.toHaveProperty('email')
    const contact = await readAdmin(['users', VOL, 'private', 'contact'])
    expect(contact).toMatchObject({ email: `${VOL}@x.test` })
    expect(contact?.friendCode).toMatch(CODE_RE)
    expect(await readAdmin(['friendCodes', contact?.friendCode as string])).toMatchObject({ uid: VOL })
  })

  it('lookupFriendCode finds a friend by the code however it is typed, and nothing for garbage', async () => {
    const code = (await readAdmin(['users', VOL, 'private', 'contact']))?.friendCode as string
    expect(await as(FRIEND, () => lookupFriendCode(formatCode(code).toLowerCase()))).toEqual({ uid: VOL, displayName: `Person ${VOL}` })
    expect(await as(FRIEND, () => lookupFriendCode('ZZZZZZZZ'))).toBeNull()
    expect(await as(FRIEND, () => lookupFriendCode('not a code'))).toBeNull()
  })

  it('ensureMyContact upgrades an account that predates the split — once', async () => {
    await env.withSecurityRulesDisabled((c) =>
      setDoc(doc(c.firestore(), 'users', 'legacy'), {
        uid: 'legacy', email: 'legacy@x.test', displayName: 'Legacy Larry', homeState: 'NJ', accountType: 'member', ageBand: '18+',
        orgId: null, totalPoints: 0, totalHoursApproved: 0, currentStreakWeeks: 0, longestStreakWeeks: 0, lastServiceDate: null, createdAt: 1, lastActiveAt: 1,
      }),
    )
    const first = await as('legacy', () => ensureMyContact({ uid: 'legacy', email: 'legacy@x.test', displayName: 'Legacy Larry' }))
    expect(first.friendCode).toMatch(CODE_RE)
    expect(await as('legacy', () => ensureMyContact({ uid: 'legacy', email: 'legacy@x.test', displayName: 'Legacy Larry' }))).toEqual(first)
  })

  it('users and friend codes cannot be enumerated with the real SDK', async () => {
    await assertFails(as(VOL, async () => getDocs(collection(holder.db as never, 'users'))))
    await assertFails(as(VOL, async () => getDocs(collection(holder.db as never, 'friendCodes'))))
    await assertFails(as(VOL, async () => getDoc(doc(holder.db as never, 'users', FRIEND, 'private', 'contact'))))
  })

  it('subscribeAllContacts: an admin gets every email, anyone else is refused', async () => {
    const contacts = await as(ADMIN, () => once((ok, fail) => subscribeAllContacts(ok, fail)))
    expect(contacts.get(VOL)?.email).toBe(`${VOL}@x.test`)
    await assertFails(as(VOL, () => once((ok, fail) => subscribeAllContacts(ok, fail))))
  })
})

describe('join codes, through the real client functions', () => {
  let code = ''
  const signUp = (uid: string) =>
    as(uid, () => createUserProfile({ uid, email: `${uid}@x.test`, displayName: `Person ${uid}`, homeState: 'NJ', accountType: 'member', ageBand: '13-17' }))

  it('an officer issues a code', async () => {
    code = await as(OFFICER, () => issueJoinCode({ orgId, officerUid: OFFICER, current: [] }))
    expect(code).toMatch(CODE_RE)
  })

  it('a volunteer joins at once with it (any case/format), then can log hours', async () => {
    await signUp('joiner')
    const result = await as('joiner', () => joinWithCode({ code: formatCode(code).toLowerCase(), uid: 'joiner', displayName: 'Person joiner' }))
    expect(result).toEqual({ orgId, alreadyMember: false })
    expect(await readAdmin(['organizations', orgId, 'members', 'joiner'])).toMatchObject({ status: 'approved', roleInOrg: 'member', approvedByUid: OFFICER, joinCode: code })
    await assertSucceeds(as('joiner', () => submitHourLog({ memberUid: 'joiner', orgId, petId: 'fox', date: '2026-11-08', hours: 1, description: 'Joined by code', attachment: null })))
    expect(await as('joiner', () => joinWithCode({ code, uid: 'joiner', displayName: 'Person joiner' }))).toEqual({ orgId, alreadyMember: true })
  })

  it('a pending applicant is promoted by presenting the code', async () => {
    await signUp('waiter')
    await as('waiter', () => applyToOrganization({ orgId, uid: 'waiter', displayName: 'Person waiter' }))
    expect(await readAdmin(['organizations', orgId, 'members', 'waiter'])).toMatchObject({ status: 'applied' })
    await as('waiter', () => joinWithCode({ code, uid: 'waiter', displayName: 'Person waiter' }))
    expect(await readAdmin(['organizations', orgId, 'members', 'waiter'])).toMatchObject({ status: 'approved', joinCode: code })
  })

  it('replacing the code switches the old one off at once', async () => {
    const rows = await as(OFFICER, () => once((ok) => subscribeOrgJoinCodes(orgId, ok)))
    expect(rows.filter((r) => r.active)).toHaveLength(1)
    const next = await as(OFFICER, () => issueJoinCode({ orgId, officerUid: OFFICER, current: rows }))
    await signUp('late')
    await expect(as('late', () => joinWithCode({ code, uid: 'late', displayName: 'Person late' }))).rejects.toBeInstanceOf(JoinCodeError)
    await as('late', () => joinWithCode({ code: next, uid: 'late', displayName: 'Person late' }))
    expect(await readAdmin(['organizations', orgId, 'members', 'late'])).toMatchObject({ status: 'approved', joinCode: next })
  })

  it('refuses garbage and unknown codes with a friendly error', async () => {
    await expect(as('late', () => joinWithCode({ code: 'nope', uid: 'late', displayName: 'x' }))).rejects.toBeInstanceOf(JoinCodeError)
    await expect(as('late', () => joinWithCode({ code: 'ZZZZZZZZ', uid: 'late', displayName: 'x' }))).rejects.toBeInstanceOf(JoinCodeError)
  })

  it('a code cannot override an officer’s rejection', async () => {
    await signUp('rejectee')
    await env.withSecurityRulesDisabled((c) =>
      setDoc(doc(c.firestore(), 'organizations', orgId, 'members', 'rejectee'), {
        uid: 'rejectee', displayName: 'Person rejectee', status: 'rejected', roleInOrg: 'member', appliedAt: 1, approvedAt: null, approvedByUid: OFFICER, totalHoursApprovedForOrg: 0,
      }),
    )
    const live = (await as(OFFICER, () => once<{ code: string; active: boolean }[]>((ok) => subscribeOrgJoinCodes(orgId, ok)))).find((r) => r.active)!
    await expect(as('rejectee', () => joinWithCode({ code: live.code, uid: 'rejectee', displayName: 'Person rejectee' }))).rejects.toBeInstanceOf(JoinCodeError)
  })

  it('only the issuing org’s officers can switch a code off or issue one', async () => {
    const live = (await as(OFFICER, () => once<{ code: string; active: boolean }[]>((ok) => subscribeOrgJoinCodes(orgId, ok)))).find((r) => r.active)!
    await assertFails(as(VOL, () => turnOffJoinCode(live.code))) // a member
    await assertFails(as(OUTSIDER, () => turnOffJoinCode(live.code))) // officer of a different (rejected) org
    await assertFails(as(OUTSIDER, () => issueJoinCode({ orgId: rejectedOrgId, officerUid: OUTSIDER, current: [] }))) // org is not approved
    await assertFails(as(OUTSIDER, () => issueJoinCode({ orgId, officerUid: OUTSIDER, current: [] }))) // not their org
    await assertSucceeds(as(OFFICER, () => turnOffJoinCode(live.code)))
  })
})
