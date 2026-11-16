import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'

// RULES_FILE lets you point this suite at a different rules file, e.g. the legacy one, to confirm the
// attack tests actually fail against vulnerable rules (they should: that is what makes them meaningful).
const RULES_PATH = process.env.RULES_FILE ? resolve(process.env.RULES_FILE) : resolve(__dirname, '../firestore.rules')
const RULES = readFileSync(RULES_PATH, 'utf8')

const OWNER = 'HAwkbqkr4rYerePOfWxdQZn7tUG3'
const ADMIN = 'admin1'
const O1 = 'officer1' // approved officer of approved orgA
const M1 = 'member1' // approved member of orgA
const M2 = 'member2' // member of nothing
const X = 'attacker' // self-registered "organization_officer", no org
const X_TAMPERED = 'attackerTampered' // already poisoned: profile.orgId = 'orgA' but no membership
const P1 = 'pendingOfficer' // officer record in PENDING orgP
const PUPPET = 'puppet' // approved member of pending orgP
const T1 = 'testUser' // site-owner-flagged test account

let env: RulesTestEnvironment

const profile = (uid: string, extra: Record<string, unknown> = {}) => ({
  uid,
  displayName: `User ${uid}`,
  homeState: 'NJ',
  accountType: 'member',
  ageBand: '18+',
  nonprofitType: null,
  irsClassification: null,
  orgId: null,
  totalPoints: 0,
  totalHoursApproved: 0,
  currentStreakWeeks: 0,
  longestStreakWeeks: 0,
  lastServiceDate: null,
  createdAt: 1,
  lastActiveAt: 1,
  ...extra,
})

const orgDoc = (orgId: string, extra: Record<string, unknown> = {}) => ({
  orgId,
  name: 'Paws Rescue',
  legalName: 'Paws Rescue Inc',
  address: { street: '1 Main St', city: 'Newark', state: 'NJ', zip: '07101' },
  location: { lat: 40.7, lng: -74.1 },
  contactEmail: 'hello@paws.org',
  contactPhone: '5551234567',
  website: 'https://paws.org',
  causeArea: 'Animals',
  nonprofitType: null,
  irsClassification: null,
  status: 'pending',
  submittedByUid: 'someone',
  createdAt: 1,
  reviewedAt: null,
  reviewedByAdminUid: null,
  rejectionReason: null,
  memberCount: 1,
  ...extra,
})

const memberDoc = (uid: string, extra: Record<string, unknown> = {}) => ({
  uid,
  displayName: `User ${uid}`,
  status: 'approved',
  roleInOrg: 'member',
  appliedAt: 1,
  approvedAt: 2,
  approvedByUid: O1,
  totalHoursApprovedForOrg: 0,
  ...extra,
})

const logDoc = (logId: string, memberUid: string, orgId: string, extra: Record<string, unknown> = {}) => ({
  logId,
  memberUid,
  orgId,
  petId: 'fox',
  date: '2026-11-01',
  hours: 2,
  description: 'Walked dogs',
  attachmentURLs: [],
  status: 'pending',
  submittedAt: 1000,
  reviewedAt: null,
  reviewedByUid: null,
  rejectionReason: null,
  signatureURL: null,
  pointsAwarded: null,
  replyImageURL: null,
  replyAt: null,
  ...extra,
})

const jpeg = (n = 1000) => 'data:image/jpeg;base64,' + 'A'.repeat(n)
const png = (n = 500) => 'data:image/png;base64,' + 'A'.repeat(n)

const ctx = (uid: string, claims: Record<string, unknown> = {}) =>
  env.authenticatedContext(uid, { email: `${uid}@x.test`, email_verified: true, ...claims })
const db = (uid: string, claims: Record<string, unknown> = {}) => ctx(uid, claims).firestore()

async function seed() {
  await env.clearFirestore()
  await env.withSecurityRulesDisabled(async (c) => {
    const f = c.firestore()
    await setDoc(doc(f, 'users', OWNER), profile(OWNER, { accountType: 'admin' }))
    await setDoc(doc(f, 'users', ADMIN), profile(ADMIN, { accountType: 'admin' }))
    await setDoc(doc(f, 'users', O1), profile(O1, { accountType: 'organization_officer', orgId: 'orgA' }))
    await setDoc(doc(f, 'users', M1), profile(M1))
    await setDoc(doc(f, 'users', M2), profile(M2))
    await setDoc(doc(f, 'users', X), profile(X, { accountType: 'organization_officer' }))
    await setDoc(doc(f, 'users', X_TAMPERED), profile(X_TAMPERED, { accountType: 'organization_officer', orgId: 'orgA' }))
    await setDoc(doc(f, 'users', P1), profile(P1, { accountType: 'organization_officer', orgId: 'orgP' }))
    await setDoc(doc(f, 'users', PUPPET), profile(PUPPET))
    await setDoc(doc(f, 'users', T1), profile(T1, { isTestAccount: true }))

    await setDoc(doc(f, 'organizations', 'orgA'), orgDoc('orgA', { status: 'approved', submittedByUid: O1, ein: '12-3456789' }))
    await setDoc(doc(f, 'organizations', 'orgA', 'members', O1), memberDoc(O1, { roleInOrg: 'officer' }))
    await setDoc(doc(f, 'organizations', 'orgA', 'members', M1), memberDoc(M1))
    await setDoc(doc(f, 'organizations', 'orgP'), orgDoc('orgP', { status: 'pending', submittedByUid: P1 }))
    await setDoc(doc(f, 'organizations', 'orgP', 'members', P1), memberDoc(P1, { roleInOrg: 'officer' }))
    await setDoc(doc(f, 'organizations', 'orgP', 'members', PUPPET), memberDoc(PUPPET))

    await setDoc(doc(f, 'hourLogs', 'log1'), logDoc('log1', M1, 'orgA'))
    await setDoc(doc(f, 'hourLogs', 'logO1'), logDoc('logO1', O1, 'orgA'))
    await setDoc(doc(f, 'hourLogs', 'logP'), logDoc('logP', PUPPET, 'orgP'))

    for (const g of ['g1', 'g2', 'g3']) {
      await setDoc(doc(f, 'users', M1, 'goals', g), {
        goalId: g, orgId: null, targetHours: 5, periodStart: '2026-11-01', periodEnd: '2026-12-01',
        progressHours: 0, status: 'active', bonusPointsAwarded: false, bonusAmount: 0,
      })
    }
    await setDoc(doc(f, 'users', M1, 'pets', 'fox'), {
      species: 'fox', name: 'Fox', xp: 0, stage: 0, unlockedCosmetics: [], lastGrownAt: null,
    })

    await setDoc(doc(f, 'users', M1, 'private', 'contact'), { email: `${M1}@x.test`, friendCode: 'AAAAAAAA' })
    await setDoc(doc(f, 'friendCodes', 'AAAAAAAA'), { uid: M1, displayName: `User ${M1}` })
    await setDoc(doc(f, 'users', M2, 'private', 'contact'), { email: `${M2}@x.test`, friendCode: 'BBBBBBBB' })
    await setDoc(doc(f, 'friendCodes', 'BBBBBBBB'), { uid: M2, displayName: `User ${M2}` })

    await setDoc(doc(f, 'organizations', 'orgB'), orgDoc('orgB', { status: 'approved', submittedByUid: 'bOfficer', ein: '22-3334445' }))
    await setDoc(doc(f, 'joinCodes', 'JJJJJJJJ'), { orgId: 'orgA', createdByUid: O1, createdAt: 1, active: true })
    await setDoc(doc(f, 'joinCodes', 'KKKKKKKK'), { orgId: 'orgA', createdByUid: O1, createdAt: 1, active: false })
    await setDoc(doc(f, 'joinCodes', 'PPPPPPPP'), { orgId: 'orgP', createdByUid: P1, createdAt: 1, active: true })

    await setDoc(doc(f, 'bulletinPosts', 'post1'), {
      postId: 'post1', authorUid: M1, authorType: 'member', orgId: null, audience: 'public',
      offersServiceHours: false, approvedCount: 0, title: 'Beach cleanup', description: 'Bring gloves',
      startAt: Date.now(), endAt: Date.now() + 86_400_000, location: { address: '', city: 'Newark', state: 'NJ' },
      tags: [], status: 'open', createdAt: 1,
    })
  })
}

beforeAll(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-vetwork-rules', firestore: { rules: RULES } })
})
afterAll(async () => {
  await env.cleanup()
})
beforeEach(seed)

// ====================================================================================
// ATTACKS. Each of these was possible against the old rules; all must now be denied.
// ====================================================================================
describe('attack: profile counters and roles', () => {
  it('a member cannot edit their own points / hours / streaks', async () => {
    const f = db(M1)
    await assertFails(updateDoc(doc(f, 'users', M1), { totalPoints: 999_999 }))
    await assertFails(updateDoc(doc(f, 'users', M1), { totalHoursApproved: 9999 }))
    await assertFails(updateDoc(doc(f, 'users', M1), { currentStreakWeeks: 52, longestStreakWeeks: 52 }))
  })

  it('a user cannot assign themselves an orgId (the old officer-escalation step)', async () => {
    await assertFails(updateDoc(doc(db(X), 'users', X), { orgId: 'orgA' }))
    await assertFails(updateDoc(doc(db(M2), 'users', M2), { orgId: 'orgA' }))
  })

  it('a user cannot change their own role or flags', async () => {
    await assertFails(updateDoc(doc(db(M1), 'users', M1), { accountType: 'admin' }))
    await assertFails(updateDoc(doc(db(M1), 'users', M1), { isTestAccount: true }))
    await assertFails(updateDoc(doc(db(M1), 'users', M1), { leaderboardHidden: false }))
  })

  it('signup cannot pre-fill counters, an orgId or privileged flags', async () => {
    const fresh = 'fresh'
    const f = db(fresh)
    const good = profile(fresh)
    await assertFails(setDoc(doc(f, 'users', fresh), { ...good, totalPoints: 5000 }))
    await assertFails(setDoc(doc(f, 'users', fresh), { ...good, totalHoursApproved: 100 }))
    await assertFails(setDoc(doc(f, 'users', fresh), { ...good, orgId: 'orgA' }))
    await assertFails(setDoc(doc(f, 'users', fresh), { ...good, accountType: 'admin' }))
    await assertFails(setDoc(doc(f, 'users', fresh), { ...good, isTestAccount: true }))
    await assertFails(setDoc(doc(f, 'users', fresh), { ...good, leaderboardHidden: false }))
    await assertFails(setDoc(doc(f, 'users', fresh), { ...good, email: 'anyone@x.test' })) // email must never go on the public profile
    await assertFails(setDoc(doc(f, 'users', fresh), { ...good, displayName: 'x'.repeat(500) }))
  })

  it('signup must carry a valid 13+ age bracket', async () => {
    const f = db('kid')
    const { ageBand: _omit, ...withoutBand } = profile('kid')
    await assertFails(setDoc(doc(f, 'users', 'kid'), withoutBand))
    await assertFails(setDoc(doc(f, 'users', 'kid'), { ...profile('kid'), ageBand: 'under-13' }))
    await assertFails(setDoc(doc(f, 'users', 'kid'), { ...profile('kid'), ageBand: '<13' }))
    await assertSucceeds(setDoc(doc(f, 'users', 'kid'), { ...profile('kid'), ageBand: '13-17' }))
  })
})

describe('attack: officer privileges are scoped to the officer’s own approved org', () => {
  const counters = { totalPoints: 100, totalHoursApproved: 10, currentStreakWeeks: 1, longestStreakWeeks: 1, lastServiceDate: '2026-11-01' }

  it('a self-declared officer cannot write anyone’s totals, pets or goals', async () => {
    await assertFails(updateDoc(doc(db(X), 'users', M1), counters))
    await assertFails(setDoc(doc(db(X), 'users', M1, 'pets', 'fox'), { species: 'fox', name: 'Hax', xp: 99999, stage: 3, unlockedCosmetics: [], lastGrownAt: 1 }))
    await assertFails(updateDoc(doc(db(X), 'users', M1, 'goals', 'g1'), { status: 'completed', bonusPointsAwarded: true, bonusAmount: 150 }))
  })

  it('even a profile already poisoned with a real orgId gains nothing without an officer membership', async () => {
    await assertFails(updateDoc(doc(db(X_TAMPERED), 'users', M1), counters))
    await assertFails(getDocs(collection(db(X_TAMPERED), 'users', M1, 'goals')))
    await assertFails(getDocs(collection(db(X_TAMPERED), 'users', M1, 'pets')))
  })

  it('a self-declared officer cannot read anyone’s goals or pets', async () => {
    await assertFails(getDocs(collection(db(X), 'users', M1, 'goals')))
    await assertFails(getDocs(collection(db(X), 'users', M1, 'pets')))
  })

  it('a real officer cannot write totals for someone outside their org', async () => {
    await assertFails(updateDoc(doc(db(O1), 'users', M2), counters))
    await assertFails(updateDoc(doc(db(O1), 'users', X), counters))
  })

  it('a real officer cannot write their own totals', async () => {
    await assertFails(updateDoc(doc(db(O1), 'users', O1), counters))
  })

  it('totals can only go up, and only by one log’s worth per write', async () => {
    const f = db(O1)
    await assertFails(updateDoc(doc(f, 'users', M1), { ...counters, totalPoints: 5000 }))
    await assertFails(updateDoc(doc(f, 'users', M1), { ...counters, totalHoursApproved: 500 }))
    await assertFails(updateDoc(doc(f, 'users', M1), { ...counters, totalPoints: -5 }))
  })

  it('officers cannot touch a counter-adjacent field (role, orgId, email)', async () => {
    await assertFails(updateDoc(doc(db(O1), 'users', M1), { accountType: 'admin' }))
    await assertFails(updateDoc(doc(db(O1), 'users', M1), { orgId: 'orgA' }))
    await assertFails(updateDoc(doc(db(O1), 'users', M1), { email: 'evil@x.test' }))
  })
})

describe('attack: unapproved (pending) organizations cannot vouch for hours', () => {
  it('officer of a pending org cannot approve a log', async () => {
    await assertFails(
      updateDoc(doc(db(P1), 'hourLogs', 'logP'), {
        status: 'approved', reviewedAt: 5, reviewedByUid: P1, signatureURL: png(), pointsAwarded: 20,
      }),
    )
  })

  it('officer of a pending org cannot read its members’ logs', async () => {
    await assertFails(getDoc(doc(db(P1), 'hourLogs', 'logP')))
  })

  it('officer of a pending org cannot post public events as the org', async () => {
    await assertFails(
      setDoc(doc(db(P1), 'bulletinPosts', 'p-org'), {
        postId: 'p-org', authorUid: P1, authorType: 'org', orgId: 'orgP', audience: 'public',
        offersServiceHours: true, approvedCount: 0, title: 'Fake', description: '',
        startAt: Date.now(), endAt: Date.now() + 1000, location: { address: '', city: 'x', state: 'NJ' },
        tags: [], status: 'open', createdAt: 1,
      }),
    )
  })

  it('officer of a pending org cannot admit members or award hours', async () => {
    await assertFails(setDoc(doc(db(P1), 'organizations', 'orgP', 'members', M2), memberDoc(M2)))
    await assertFails(updateDoc(doc(db(P1), 'organizations', 'orgP', 'members', PUPPET), { totalHoursApprovedForOrg: 24 }))
  })

  it('a pending org’s contact details are not world-readable', async () => {
    await assertFails(getDoc(doc(db(M2), 'organizations', 'orgP')))
    await assertSucceeds(getDoc(doc(db(P1), 'organizations', 'orgP'))) // its own submitter can
    await assertSucceeds(getDoc(doc(db(M2), 'organizations', 'orgA'))) // approved orgs are public
  })
})

describe('attack: hour-log tampering', () => {
  it('an officer cannot approve their own hours', async () => {
    await assertFails(
      updateDoc(doc(db(O1), 'hourLogs', 'logO1'), {
        status: 'approved', reviewedAt: 5, reviewedByUid: O1, signatureURL: png(), pointsAwarded: 20,
      }),
    )
  })

  it('an officer cannot change hours / org / member while approving', async () => {
    const f = db(O1)
    const approve = { status: 'approved', reviewedAt: 5, reviewedByUid: O1, signatureURL: png(), pointsAwarded: 20 }
    await assertFails(updateDoc(doc(f, 'hourLogs', 'log1'), { ...approve, hours: 24 }))
    await assertFails(updateDoc(doc(f, 'hourLogs', 'log1'), { ...approve, memberUid: M2 }))
    await assertFails(updateDoc(doc(f, 'hourLogs', 'log1'), { ...approve, orgId: 'orgP' }))
  })

  it('an officer cannot forge the reviewer, or approve without a signature', async () => {
    const f = db(O1)
    await assertFails(updateDoc(doc(f, 'hourLogs', 'log1'), { status: 'approved', reviewedAt: 5, reviewedByUid: 'someoneElse', signatureURL: png(), pointsAwarded: 20 }))
    await assertFails(updateDoc(doc(f, 'hourLogs', 'log1'), { status: 'approved', reviewedAt: 5, reviewedByUid: O1, signatureURL: 'https://evil.test/p.png', pointsAwarded: 20 }))
    await assertFails(updateDoc(doc(f, 'hourLogs', 'log1'), { status: 'approved', reviewedAt: 5, reviewedByUid: O1, signatureURL: png(), pointsAwarded: 1_000_000 }))
  })

  it('a volunteer cannot approve their own log or edit it after submitting', async () => {
    const f = db(M1)
    await assertFails(updateDoc(doc(f, 'hourLogs', 'log1'), { status: 'approved', reviewedByUid: M1 }))
    await assertFails(updateDoc(doc(f, 'hourLogs', 'log1'), { hours: 24 }))
  })

  it('submissions are bounded: hours, description, attachment scheme and size', async () => {
    const f = db(M1)
    const ok = logDoc('new1', M1, 'orgA')
    await assertFails(setDoc(doc(f, 'hourLogs', 'new1'), { ...ok, hours: 1_000_000 }))
    await assertFails(setDoc(doc(f, 'hourLogs', 'new1'), { ...ok, hours: -5 }))
    await assertFails(setDoc(doc(f, 'hourLogs', 'new1'), { ...ok, hours: 25 }))
    await assertFails(setDoc(doc(f, 'hourLogs', 'new1'), { ...ok, description: 'x'.repeat(2000) }))
    await assertFails(setDoc(doc(f, 'hourLogs', 'new1'), { ...ok, date: 'not-a-date' }))
    await assertFails(setDoc(doc(f, 'hourLogs', 'new1'), { ...ok, attachmentURLs: ['https://tracker.evil/p.gif'] }))
    await assertFails(setDoc(doc(f, 'hourLogs', 'new1'), { ...ok, attachmentURLs: [jpeg(500_000)] }))
  })

  it('a volunteer cannot pre-fill officer-only fields on a submission', async () => {
    const f = db(M1)
    const ok = logDoc('new1', M1, 'orgA')
    await assertFails(setDoc(doc(f, 'hourLogs', 'new1'), { ...ok, status: 'approved' }))
    await assertFails(setDoc(doc(f, 'hourLogs', 'new1'), { ...ok, awardedByOrg: true }))
    await assertFails(setDoc(doc(f, 'hourLogs', 'new1'), { ...ok, pointsAwarded: 500 }))
    await assertFails(setDoc(doc(f, 'hourLogs', 'new1'), { ...ok, reviewedByUid: O1 }))
  })

  it('a volunteer cannot submit to an org they do not belong to', async () => {
    await assertFails(setDoc(doc(db(M2), 'hourLogs', 'new1'), logDoc('new1', M2, 'orgA')))
  })

  it('reply images must be small inline JPEGs', async () => {
    const f = db(O1)
    await assertFails(updateDoc(doc(f, 'hourLogs', 'log1'), { replyImageURL: 'https://tracker.evil/p.gif', replyAt: 5 }))
    await assertFails(updateDoc(doc(f, 'hourLogs', 'log1'), { replyImageURL: jpeg(500_000), replyAt: 5 }))
  })
})

describe('attack: membership tampering', () => {
  it('a volunteer cannot join with pre-credited hours or as an officer', async () => {
    const f = db(M2)
    const ok = memberDoc(M2, { status: 'applied', approvedAt: null, approvedByUid: null })
    await assertFails(setDoc(doc(f, 'organizations', 'orgA', 'members', M2), { ...ok, totalHoursApprovedForOrg: 500 }))
    await assertFails(setDoc(doc(f, 'organizations', 'orgA', 'members', M2), { ...ok, roleInOrg: 'officer', status: 'approved' }))
    await assertFails(setDoc(doc(f, 'organizations', 'orgA', 'members', M2), { ...ok, status: 'approved' }))
  })

  it('an officer cannot promote another member or grant more than one log of hours', async () => {
    const f = db(O1)
    await assertFails(updateDoc(doc(f, 'organizations', 'orgA', 'members', M1), { roleInOrg: 'officer' }))
    await assertFails(updateDoc(doc(f, 'organizations', 'orgA', 'members', M1), { totalHoursApprovedForOrg: increment(500) }))
  })

  it('only a member’s own record or the org’s officers can read the roster', async () => {
    await assertFails(getDoc(doc(db(M2), 'organizations', 'orgA', 'members', M1)))
    await assertFails(getDocs(collection(db(M2), 'organizations', 'orgA', 'members')))
    await assertSucceeds(getDocs(collection(db(O1), 'organizations', 'orgA', 'members')))
    await assertSucceeds(getDoc(doc(db(M1), 'organizations', 'orgA', 'members', M1)))
  })

  it('nobody can list everyone’s memberships through a collection-group query', async () => {
    await assertFails(getDocs(collectionGroup(db(M2), 'members')))
    await assertSucceeds(getDocs(query(collectionGroup(db(M1), 'members'), where('uid', '==', M1))))
  })
})

describe('attack: organizations', () => {
  const newOrg = (uid: string, extra: Record<string, unknown> = {}) =>
    orgDoc('newOrg', { submittedByUid: uid, ein: '98-7654321', ...extra })

  it('an org cannot be submitted without a well-formed EIN, as approved, or for someone else', async () => {
    const f = db(M2)
    const o = newOrg(M2)
    delete (o as Record<string, unknown>).ein
    await assertFails(setDoc(doc(f, 'organizations', 'newOrg'), o))
    await assertFails(setDoc(doc(f, 'organizations', 'newOrg'), newOrg(M2, { ein: '123' })))
    await assertFails(setDoc(doc(f, 'organizations', 'newOrg'), newOrg(M2, { status: 'approved' })))
    await assertFails(setDoc(doc(f, 'organizations', 'newOrg'), newOrg(M1)))
    await assertFails(setDoc(doc(f, 'organizations', 'newOrg'), newOrg(M2, { irsVerifiedAt: 1, irsVerifiedByUid: ADMIN })))
    await assertFails(setDoc(doc(f, 'organizations', 'newOrg'), newOrg(M2, { website: 'javascript:alert(1)' })))
  })

  it('an admin cannot approve an org that has no IRS verification stamp', async () => {
    const f = db(ADMIN)
    await assertFails(updateDoc(doc(f, 'organizations', 'orgP'), { status: 'approved', reviewedAt: 5, reviewedByAdminUid: ADMIN }))
    await assertFails(
      updateDoc(doc(f, 'organizations', 'orgP'), {
        status: 'approved', reviewedAt: 5, reviewedByAdminUid: ADMIN,
        ein: 'bad', irsVerifiedAt: 5, irsVerifiedByUid: ADMIN, irsVerifiedSource: 'IRS TEOS',
      }),
    )
    await assertFails(
      updateDoc(doc(f, 'organizations', 'orgP'), {
        status: 'approved', reviewedAt: 5, reviewedByAdminUid: ADMIN,
        ein: '12-3456789', irsVerifiedAt: 5, irsVerifiedByUid: 'someone-else', irsVerifiedSource: 'IRS TEOS',
      }),
    )
  })

  it('officers cannot change status, ownership, EIN or the verification stamp', async () => {
    const f = db(O1)
    await assertFails(updateDoc(doc(f, 'organizations', 'orgA'), { status: 'suspended' }))
    await assertFails(updateDoc(doc(f, 'organizations', 'orgA'), { submittedByUid: M2 }))
    await assertFails(updateDoc(doc(f, 'organizations', 'orgA'), { ein: '11-1111111' }))
    await assertFails(updateDoc(doc(f, 'organizations', 'orgA'), { irsVerifiedAt: 1, irsVerifiedByUid: O1 }))
    await assertSucceeds(updateDoc(doc(f, 'organizations', 'orgA'), { contactPhone: '5559998888' }))
  })

  it('non-admins cannot approve or reject orgs', async () => {
    await assertFails(updateDoc(doc(db(P1), 'organizations', 'orgP'), { status: 'approved' }))
    await assertFails(updateDoc(doc(db(M1), 'organizations', 'orgP'), { status: 'rejected' }))
  })
})

describe('attack: friendships', () => {
  const base = (a: string, b: string, extra: Record<string, unknown> = {}) => {
    const [p0, p1] = [a, b].sort()
    return { participants: [p0, p1], requesterUid: a, recipientUid: b, status: 'pending', createdAt: 1, respondedAt: null, ...extra }
  }
  const idOf = (a: string, b: string) => [a, b].sort().join('_')

  it('cannot self-accept by being both requester and recipient', async () => {
    const f = db(X)
    await assertFails(setDoc(doc(f, 'friendships', idOf(X, M1)), { ...base(X, M1), recipientUid: X }))
  })

  it('cannot create a request under a mismatched id or for a stranger-pair', async () => {
    const f = db(X)
    await assertFails(setDoc(doc(f, 'friendships', 'garbage-id'), base(X, M1)))
    await assertFails(setDoc(doc(f, 'friendships', idOf(M1, M2)), { ...base(M1, M2), requesterUid: X }))
  })

  it('cannot create an already-accepted friendship', async () => {
    await assertFails(setDoc(doc(db(X), 'friendships', idOf(X, M1)), base(X, M1, { status: 'accepted' })))
  })

  it('the recipient can only change status and respondedAt', async () => {
    await env.withSecurityRulesDisabled((c) => setDoc(doc(c.firestore(), 'friendships', idOf(X, M1)), base(X, M1)))
    await assertFails(updateDoc(doc(db(M1), 'friendships', idOf(X, M1)), { status: 'accepted', participants: [M1, M2] }))
    await assertFails(updateDoc(doc(db(X), 'friendships', idOf(X, M1)), { status: 'accepted' })) // requester can't self-accept
    await assertSucceeds(updateDoc(doc(db(M1), 'friendships', idOf(X, M1)), { status: 'accepted', respondedAt: 9 }))
  })

  it('strangers cannot read a friendship', async () => {
    await env.withSecurityRulesDisabled((c) => setDoc(doc(c.firestore(), 'friendships', idOf(X, M1)), base(X, M1)))
    await assertFails(getDoc(doc(db(M2), 'friendships', idOf(X, M1))))
  })
})

describe('attack: goals and bulletin posts', () => {
  const goal = (id: string, extra: Record<string, unknown> = {}) => ({
    goalId: id, orgId: null, targetHours: 5, periodStart: '2026-11-01', periodEnd: '2026-12-01',
    progressHours: 0, status: 'active', bonusPointsAwarded: false, bonusAmount: 0, ...extra,
  })

  it('goals cannot be created tiny, pre-completed or pre-bonused, and owners cannot edit progress', async () => {
    const f = db(M1)
    await assertFails(setDoc(doc(f, 'users', M1, 'goals', 'n1'), goal('n1', { targetHours: 0.25 })))
    await assertFails(setDoc(doc(f, 'users', M1, 'goals', 'n1'), goal('n1', { progressHours: 5, status: 'completed' })))
    await assertFails(setDoc(doc(f, 'users', M1, 'goals', 'n1'), goal('n1', { bonusPointsAwarded: true, bonusAmount: 150 })))
    await assertFails(updateDoc(doc(f, 'users', M1, 'goals', 'g1'), { status: 'completed', bonusAmount: 150 }))
    await assertSucceeds(setDoc(doc(f, 'users', M1, 'goals', 'n1'), goal('n1')))
  })

  it('a member-authored post cannot carry an org identity', async () => {
    const post = {
      postId: 'p-spoof', authorUid: M1, authorType: 'member', orgId: 'orgA', audience: 'public',
      offersServiceHours: true, approvedCount: 0, title: 'Official Paws event', description: '',
      startAt: Date.now(), endAt: Date.now() + 1000, location: { address: '', city: 'x', state: 'NJ' },
      tags: [], status: 'open', createdAt: 1,
    }
    await assertFails(setDoc(doc(db(M1), 'bulletinPosts', 'p-spoof'), post))
    await assertSucceeds(setDoc(doc(db(M1), 'bulletinPosts', 'p-spoof'), { ...post, orgId: null }))
  })

  it('bulletin posts reject oversized text', async () => {
    const post = {
      postId: 'p-big', authorUid: M1, authorType: 'member', orgId: null, audience: 'public',
      offersServiceHours: false, approvedCount: 0, title: 'x'.repeat(5000), description: '',
      startAt: Date.now(), endAt: Date.now() + 1000, location: { address: '', city: 'x', state: 'NJ' },
      tags: [], status: 'open', createdAt: 1,
    }
    await assertFails(setDoc(doc(db(M1), 'bulletinPosts', 'p-big'), post))
  })
})

describe('storage-adjacent: nothing else is reachable', () => {
  it('unknown collections are denied', async () => {
    await assertFails(getDoc(doc(db(ADMIN), 'secrets', 'x')))
    await assertFails(setDoc(doc(db(ADMIN), 'secrets', 'x'), { a: 1 }))
  })
  it('signed-out users can read nothing', async () => {
    const anon = env.unauthenticatedContext().firestore()
    await assertFails(getDoc(doc(anon, 'users', M1)))
    await assertFails(getDoc(doc(anon, 'organizations', 'orgA')))
  })
})

// ====================================================================================
// HAPPY PATHS. The legitimate flows must still work, including the multi-document
// transactions (which are also the ones that stress rules' document-access limits).
// ====================================================================================
describe('happy path: signup, orgs, membership', () => {
  it('a new member signs up with a clean profile', async () => {
    const f = db('fresh')
    await assertSucceeds(setDoc(doc(f, 'users', 'fresh'), profile('fresh')))
  })

  it('a new org officer signs up, submits an org with an EIN, and becomes its (pending) officer', async () => {
    const uid = 'newOfficer'
    const f = db(uid)
    await assertSucceeds(setDoc(doc(f, 'users', uid), profile(uid, { accountType: 'organization_officer' })))
    await assertSucceeds(setDoc(doc(f, 'organizations', 'orgN'), orgDoc('orgN', { submittedByUid: uid, ein: '55-1234567' })))
    await assertSucceeds(
      setDoc(doc(f, 'organizations', 'orgN', 'members', uid), memberDoc(uid, { roleInOrg: 'officer', approvedByUid: uid })),
    )
  })

  it('an admin approves an org WITH an IRS stamp and links the submitter', async () => {
    const f = db(ADMIN)
    await assertSucceeds(
      updateDoc(doc(f, 'organizations', 'orgP'), {
        status: 'approved', reviewedAt: 5, reviewedByAdminUid: ADMIN, rejectionReason: null,
        ein: '12-3456789', irsVerifiedAt: 5, irsVerifiedByUid: ADMIN, irsVerifiedSource: 'IRS Pub 78 + ProPublica; subsection 03',
      }),
    )
    await assertSucceeds(updateDoc(doc(f, 'users', P1), { orgId: 'orgP' }))
  })

  it('an admin can retro-verify an org that was approved before verification existed', async () => {
    const f = db(ADMIN)
    // orgA is approved in the seed but has no stamp yet.
    await assertSucceeds(
      updateDoc(doc(f, 'organizations', 'orgA'), {
        ein: '12-3456789', irsVerifiedAt: 5, irsVerifiedByUid: ADMIN, irsVerifiedSource: 'IRS TEOS',
      }),
    )
    // ...but only with a real EIN and in the admin's own name.
    await assertFails(updateDoc(doc(f, 'organizations', 'orgA'), { ein: 'nope', irsVerifiedAt: 5, irsVerifiedByUid: ADMIN }))
    await assertFails(updateDoc(doc(f, 'organizations', 'orgA'), { ein: '12-3456789', irsVerifiedAt: 5, irsVerifiedByUid: M1 }))
  })

  it('approving and linking the submitter works as one atomic batch (what approveOrganization does)', async () => {
    const f = db(ADMIN)
    const b = writeBatch(f)
    b.update(doc(f, 'organizations', 'orgP'), {
      status: 'approved', reviewedAt: 5, reviewedByAdminUid: ADMIN, rejectionReason: null,
      ein: '12-3456789', irsVerifiedAt: 5, irsVerifiedByUid: ADMIN, irsVerifiedSource: 'IRS TEOS',
    })
    b.update(doc(f, 'users', P1), { orgId: 'orgP' })
    await assertSucceeds(b.commit())
  })

  it('an admin can reject or re-stamp without approving', async () => {
    const f = db(ADMIN)
    await assertSucceeds(updateDoc(doc(f, 'organizations', 'orgP'), { status: 'rejected', reviewedAt: 5, reviewedByAdminUid: ADMIN, rejectionReason: 'Not 501(c)(3)' }))
  })

  it('a volunteer applies, is admitted, and may re-apply after a rejection', async () => {
    const applied = memberDoc(M2, { status: 'applied', approvedAt: null, approvedByUid: null })
    await assertSucceeds(setDoc(doc(db(M2), 'organizations', 'orgA', 'members', M2), applied))
    await assertSucceeds(
      updateDoc(doc(db(O1), 'organizations', 'orgA', 'members', M2), { status: 'rejected', approvedAt: null, approvedByUid: O1 }),
    )
    await assertSucceeds(setDoc(doc(db(M2), 'organizations', 'orgA', 'members', M2), applied))
    await assertSucceeds(
      updateDoc(doc(db(O1), 'organizations', 'orgA', 'members', M2), { status: 'approved', approvedAt: 9, approvedByUid: O1 }),
    )
  })

  it('a volunteer finds their own applications with a collection-group query', async () => {
    await assertSucceeds(getDocs(query(collectionGroup(db(M1), 'members'), where('uid', '==', M1))))
  })

  it('the signed-in lists the leaderboard and approved orgs', async () => {
    await assertSucceeds(getDocs(query(collection(db(M2), 'organizations'), where('status', '==', 'approved'))))
    await assertSucceeds(getDoc(doc(db(M2), 'users', M1)))
  })

  it('an admin lists pending orgs', async () => {
    await assertSucceeds(getDocs(query(collection(db(ADMIN), 'organizations'), where('status', '==', 'pending'))))
  })

  it('the site owner promotes and demotes an admin, and flags a test account', async () => {
    const f = db(OWNER)
    await assertSucceeds(updateDoc(doc(f, 'users', M2), { accountType: 'admin', roleBeforeAdmin: 'member' }))
    await assertSucceeds(updateDoc(doc(f, 'users', T1), { isTestAccount: false }))
  })

  it('an owner may edit cosmetic profile fields', async () => {
    await assertSucceeds(updateDoc(doc(db(M1), 'users', M1), { displayName: 'Maya R.', lastActiveAt: 99 }))
  })
})

describe('happy path: hour logs end to end', () => {
  it('a volunteer submits a pending log with a photo', async () => {
    await assertSucceeds(setDoc(doc(db(M1), 'hourLogs', 'new1'), logDoc('new1', M1, 'orgA', { attachmentURLs: [jpeg(100_000)] })))
  })

  it('a volunteer reads their own logs and an officer reads the org’s pending queue', async () => {
    await assertSucceeds(getDocs(query(collection(db(M1), 'hourLogs'), where('memberUid', '==', M1))))
    await assertSucceeds(getDocs(query(collection(db(O1), 'hourLogs'), where('orgId', '==', 'orgA'), where('status', '==', 'pending'))))
  })

  it('an officer sends a reply image back to the volunteer', async () => {
    await assertSucceeds(updateDoc(doc(db(O1), 'hourLogs', 'log1'), { replyImageURL: jpeg(), replyAt: 5 }))
  })

  it('a volunteer can delete a still-pending log but not an approved one', async () => {
    await env.withSecurityRulesDisabled((c) =>
      setDoc(doc(c.firestore(), 'hourLogs', 'done'), logDoc('done', M1, 'orgA', { status: 'approved', reviewedAt: 5, reviewedByUid: O1, pointsAwarded: 20 })),
    )
    await assertFails(deleteDoc(doc(db(M1), 'hourLogs', 'done')))
    await assertFails(deleteDoc(doc(db(M2), 'hourLogs', 'log1')))
    await assertSucceeds(deleteDoc(doc(db(M1), 'hourLogs', 'log1')))
  })

  it('officer approves a log: the full approveHourLog transaction (log + member + user + pet + 3 goals)', async () => {
    const f = db(O1)
    await assertSucceeds(
      runTransaction(f, async (tx) => {
        await tx.get(doc(f, 'hourLogs', 'log1'))
        await tx.get(doc(f, 'organizations', 'orgA', 'members', M1))
        await tx.get(doc(f, 'users', M1))
        await tx.get(doc(f, 'users', M1, 'pets', 'fox'))
        tx.update(doc(f, 'hourLogs', 'log1'), {
          status: 'approved', reviewedAt: 5, reviewedByUid: O1, signatureURL: png(), pointsAwarded: 45,
        })
        tx.update(doc(f, 'organizations', 'orgA', 'members', M1), { totalHoursApprovedForOrg: increment(2) })
        tx.set(doc(f, 'users', M1, 'pets', 'fox'), { species: 'fox', name: 'Fox', xp: 2, stage: 0, unlockedCosmetics: [], lastGrownAt: 5 }, { merge: true })
        for (const g of ['g1', 'g2', 'g3']) {
          tx.update(doc(f, 'users', M1, 'goals', g), { progressHours: 2, status: 'active', bonusPointsAwarded: false, bonusAmount: 0 })
        }
        tx.update(doc(f, 'users', M1), {
          totalPoints: 45, totalHoursApproved: 2, currentStreakWeeks: 1, longestStreakWeeks: 1, lastServiceDate: '2026-11-01',
        })
      }),
    )
  })

  it('officer rejects a log with a reason', async () => {
    await assertSucceeds(
      updateDoc(doc(db(O1), 'hourLogs', 'log1'), { status: 'rejected', reviewedAt: 5, reviewedByUid: O1, rejectionReason: 'Photo unreadable' }),
    )
  })

  it('officer awards hours to a student who is not yet a member (awardHours transaction)', async () => {
    const f = db(O1)
    // These reads happen BEFORE the transaction, while the student is still outside the org.
    await assertSucceeds(getDocs(collection(f, 'users', M2, 'pets')))
    await assertSucceeds(getDocs(query(collection(f, 'users', M2, 'goals'), where('status', '==', 'active'))))
    await assertSucceeds(
      runTransaction(f, async (tx) => {
        await tx.get(doc(f, 'organizations', 'orgA', 'members', M2))
        await tx.get(doc(f, 'users', M2))
        tx.set(doc(f, 'organizations', 'orgA', 'members', M2), memberDoc(M2, { approvedByUid: O1, totalHoursApprovedForOrg: 3 }))
        tx.set(
          doc(f, 'hourLogs', 'award1'),
          logDoc('award1', M2, 'orgA', {
            hours: 3, status: 'approved', reviewedAt: 5, reviewedByUid: O1, pointsAwarded: 30, awardedByOrg: true,
          }),
        )
        tx.set(doc(f, 'users', M2, 'pets', 'fox'), { species: 'fox', name: 'Fox', xp: 3, stage: 0, unlockedCosmetics: [], lastGrownAt: 5 }, { merge: true })
        tx.update(doc(f, 'users', M2), { totalPoints: 30, totalHoursApproved: 3, currentStreakWeeks: 1, longestStreakWeeks: 1, lastServiceDate: '2026-11-01' })
      }),
    )
  })

  it('officer awarding hours to themselves is refused', async () => {
    await assertFails(
      setDoc(doc(db(O1), 'hourLogs', 'self'), logDoc('self', O1, 'orgA', { status: 'approved', reviewedAt: 5, reviewedByUid: O1, pointsAwarded: 30, awardedByOrg: true })),
    )
  })
})

describe('happy path: social, goals, events', () => {
  it('friend request → accept', async () => {
    const id = [M1, M2].sort().join('_')
    const [p0, p1] = [M1, M2].sort()
    await assertSucceeds(
      setDoc(doc(db(M1), 'friendships', id), { participants: [p0, p1], requesterUid: M1, recipientUid: M2, status: 'pending', createdAt: 1, respondedAt: null }),
    )
    await assertSucceeds(updateDoc(doc(db(M2), 'friendships', id), { status: 'accepted', respondedAt: 2 }))
    await assertSucceeds(getDocs(query(collection(db(M1), 'friendships'), where('participants', 'array-contains', M1))))
  })

  it('a member creates and deletes a goal, and edits their own island', async () => {
    const f = db(M1)
    const g = { goalId: 'gz', orgId: null, targetHours: 10, periodStart: '2026-11-01', periodEnd: '2026-12-01', progressHours: 0, status: 'active', bonusPointsAwarded: false, bonusAmount: 0 }
    await assertSucceeds(setDoc(doc(f, 'users', M1, 'goals', 'gz'), g))
    await assertSucceeds(deleteDoc(doc(f, 'users', M1, 'goals', 'gz')))
    await assertSucceeds(setDoc(doc(f, 'users', M1, 'island', 'state'), { petPositions: {} }))
    await assertFails(setDoc(doc(db(M2), 'users', M1, 'island', 'state'), { petPositions: {} }))
  })

  it('a member posts an event and another member RSVPs; the author approves', async () => {
    const post = {
      postId: 'p2', authorUid: M1, authorType: 'member', orgId: null, audience: 'public', offersServiceHours: true,
      approvedCount: 0, title: 'Food drive', description: 'Cans please', startAt: Date.now(), endAt: Date.now() + 86_400_000,
      location: { address: '1 Main', city: 'Newark', state: 'NJ' }, tags: ['food'], status: 'open', createdAt: 1,
    }
    await assertSucceeds(setDoc(doc(db(M1), 'bulletinPosts', 'p2'), post))
    await assertSucceeds(
      setDoc(doc(db(M2), 'bulletinPosts', 'p2', 'rsvps', M2), { uid: M2, displayName: 'User member2', status: 'pending', createdAt: 1, decidedAt: null }),
    )
    const f = db(M1)
    await assertSucceeds(
      runTransaction(f, async (tx) => {
        await tx.get(doc(f, 'bulletinPosts', 'p2', 'rsvps', M2))
        tx.update(doc(f, 'bulletinPosts', 'p2', 'rsvps', M2), { status: 'approved', decidedAt: 5 })
        tx.update(doc(f, 'bulletinPosts', 'p2'), { approvedCount: increment(1) })
      }),
    )
  })

  it('an approved officer posts an org event for members only', async () => {
    const post = {
      postId: 'p3', authorUid: O1, authorType: 'org', orgId: 'orgA', audience: 'members', offersServiceHours: true,
      approvedCount: 0, title: 'Kennel day', description: '', startAt: Date.now(), endAt: Date.now() + 86_400_000,
      location: { address: '', city: 'Newark', state: 'NJ' }, tags: [], status: 'open', createdAt: 1,
    }
    await assertSucceeds(setDoc(doc(db(O1), 'bulletinPosts', 'p3'), post))
    await assertSucceeds(getDoc(doc(db(M1), 'bulletinPosts', 'p3')))
    await assertFails(getDoc(doc(db(M2), 'bulletinPosts', 'p3')))
  })

  it('an admin deletes a post; a regular member cannot', async () => {
    await assertFails(deleteDoc(doc(db(M2), 'bulletinPosts', 'post1')))
    const f = db(ADMIN)
    const b = writeBatch(f)
    b.delete(doc(f, 'bulletinPosts', 'post1'))
    await assertSucceeds(b.commit())
  })
})

describe('happy path: test accounts (demo data)', () => {
  it('a test account auto-approves an org, joins it and logs auto-approved hours', async () => {
    const f = db(T1)
    await assertSucceeds(setDoc(doc(f, 'organizations', 'orgT'), orgDoc('orgT', { status: 'approved', submittedByUid: T1, reviewedAt: 1 })))
    await assertSucceeds(setDoc(doc(f, 'organizations', 'orgT', 'members', T1), memberDoc(T1, { roleInOrg: 'officer', approvedByUid: T1 })))
    await assertSucceeds(updateDoc(doc(f, 'users', T1), { orgId: 'orgT' }))
    await assertSucceeds(setDoc(doc(f, 'organizations', 'orgA', 'members', T1), memberDoc(T1, { approvedByUid: T1 })))
    await assertSucceeds(
      setDoc(doc(f, 'hourLogs', 'tlog'), logDoc('tlog', T1, 'orgA', { status: 'approved', reviewedAt: 5, reviewedByUid: T1, pointsAwarded: 20, autoApproved: true })),
    )
  })

  it('a test account re-applying to an org it already joined still works', async () => {
    const f = db(T1)
    await assertSucceeds(setDoc(doc(f, 'organizations', 'orgA', 'members', T1), memberDoc(T1, { approvedByUid: T1 })))
    await assertSucceeds(
      setDoc(doc(f, 'organizations', 'orgA', 'members', T1), memberDoc(T1, { approvedByUid: T1, appliedAt: 999, approvedAt: 999 })),
    )
  })

  it('a normal user cannot use any test-account shortcut', async () => {
    const f = db(M2)
    await assertFails(setDoc(doc(f, 'organizations', 'orgT'), orgDoc('orgT', { status: 'approved', submittedByUid: M2 })))
    await assertFails(setDoc(doc(f, 'organizations', 'orgA', 'members', M2), memberDoc(M2)))
    await assertFails(setDoc(doc(f, 'hourLogs', 'x'), logDoc('x', M1, 'orgA', { status: 'approved', reviewedByUid: M1, pointsAwarded: 20 })))
  })
})

// ====================================================================================
// PRIVACY: private contact details, friend codes, user enumeration.
// ====================================================================================
const CONTACT = (uid: string, code: string, email = `${uid}@x.test`) => ({ email, friendCode: code })

describe('attack: private contact details and user enumeration', () => {
  it('only the owner and admins can read a user’s email', async () => {
    await assertSucceeds(getDoc(doc(db(M1), 'users', M1, 'private', 'contact')))
    await assertSucceeds(getDoc(doc(db(ADMIN), 'users', M1, 'private', 'contact')))
    await assertFails(getDoc(doc(db(M2), 'users', M1, 'private', 'contact')))
    await assertFails(getDoc(doc(db(O1), 'users', M1, 'private', 'contact'))) // not even an officer
    await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), 'users', M1, 'private', 'contact')))
  })

  it('nobody but an admin can sweep every contact document with a collection-group query', async () => {
    await assertFails(getDocs(collectionGroup(db(M2), 'private')))
    await assertFails(getDocs(collectionGroup(db(O1), 'private')))
    await assertSucceeds(getDocs(collectionGroup(db(ADMIN), 'private')))
  })

  it('contact details are write-once and must be the caller’s own', async () => {
    const f = db(M1)
    await assertFails(updateDoc(doc(f, 'users', M1, 'private', 'contact'), { email: 'evil@x.test' }))
    await assertFails(updateDoc(doc(f, 'users', M1, 'private', 'contact'), { friendCode: 'CCCCCCCC' }))
    await assertFails(setDoc(doc(db(M2), 'users', M1, 'private', 'contact'), CONTACT(M1, 'DDDDDDDD')))
    await assertFails(setDoc(doc(db(X), 'users', X, 'private', 'contact'), CONTACT(X, 'DDDDDDDD', 'someone-else@x.test')))
    await assertFails(setDoc(doc(db(X), 'users', X, 'private', 'other'), CONTACT(X, 'DDDDDDDD')))
  })

  it('users cannot be enumerated: no unbounded or oversized list, only the bounded leaderboard query', async () => {
    const f = db(M2)
    await assertFails(getDocs(collection(f, 'users')))
    await assertFails(getDocs(query(collection(f, 'users'), limit(5000))))
    await assertSucceeds(
      getDocs(query(collection(f, 'users'), where('accountType', '==', 'member'), orderBy('totalPoints', 'desc'), limit(100))),
    )
    await assertSucceeds(getDocs(collection(db(ADMIN), 'users')))
    await assertSucceeds(getDoc(doc(f, 'users', M1))) // looking up someone you already know still works
  })

  it('friend codes cannot be listed or searched, only fetched by whoever holds the code', async () => {
    await assertFails(getDocs(collection(db(M2), 'friendCodes')))
    await assertFails(getDocs(query(collection(db(M2), 'friendCodes'), where('uid', '==', M1))))
    await assertSucceeds(getDoc(doc(db(M2), 'friendCodes', 'AAAAAAAA')))
    await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), 'friendCodes', 'AAAAAAAA')))
  })

  it('a friend code cannot be hijacked, re-pointed, or claimed twice', async () => {
    const f = db(M2)
    await assertFails(setDoc(doc(f, 'friendCodes', 'AAAAAAAA'), { uid: M2, displayName: `User ${M2}` })) // M1’s code
    await assertFails(updateDoc(doc(db(M1), 'friendCodes', 'AAAAAAAA'), { uid: M2 }))
    await assertFails(deleteDoc(doc(db(M1), 'friendCodes', 'AAAAAAAA')))
  })
})

describe('happy path: signup writes profile + contact + friend code atomically', () => {
  const claim = (uid: string, code: string, name = `User ${uid}`) => {
    const f = db(uid)
    const b = writeBatch(f)
    b.set(doc(f, 'users', uid), profile(uid, { displayName: name }))
    b.set(doc(f, 'users', uid, 'private', 'contact'), CONTACT(uid, code))
    b.set(doc(f, 'friendCodes', code), { uid, displayName: name })
    return b
  }

  it('commits the three documents together', async () => {
    await assertSucceeds(claim('newbie', 'CCCCCCCC').commit())
    await assertSucceeds(getDoc(doc(db('newbie'), 'users', 'newbie', 'private', 'contact')))
    await assertSucceeds(getDoc(doc(db(M2), 'friendCodes', 'CCCCCCCC')))
  })

  it('a code that is already taken fails the whole signup (so the client retries with a new one)', async () => {
    await assertFails(claim('newbie', 'AAAAAAAA').commit())
  })

  it('refuses a code that does not match the user’s own contact document, a forged name, or another user’s uid', async () => {
    const f = db('newbie')
    const noContact = writeBatch(f)
    noContact.set(doc(f, 'users', 'newbie'), profile('newbie'))
    noContact.set(doc(f, 'friendCodes', 'CCCCCCCC'), { uid: 'newbie', displayName: 'User newbie' })
    await assertFails(noContact.commit())

    const forgedName = writeBatch(f)
    forgedName.set(doc(f, 'users', 'newbie'), profile('newbie'))
    forgedName.set(doc(f, 'users', 'newbie', 'private', 'contact'), CONTACT('newbie', 'CCCCCCCC'))
    forgedName.set(doc(f, 'friendCodes', 'CCCCCCCC'), { uid: 'newbie', displayName: 'Principal Smith' })
    await assertFails(forgedName.commit())

    const wrongUid = writeBatch(f)
    wrongUid.set(doc(f, 'users', 'newbie'), profile('newbie'))
    wrongUid.set(doc(f, 'users', 'newbie', 'private', 'contact'), CONTACT('newbie', 'CCCCCCCC'))
    wrongUid.set(doc(f, 'friendCodes', 'CCCCCCCC'), { uid: M1, displayName: 'User newbie' })
    await assertFails(wrongUid.commit())
  })

  it('an existing account that predates the split can create its contact + code once', async () => {
    const f = db(PUPPET)
    const b = writeBatch(f)
    b.set(doc(f, 'users', PUPPET, 'private', 'contact'), CONTACT(PUPPET, 'EEEEEEEE'))
    b.set(doc(f, 'friendCodes', 'EEEEEEEE'), { uid: PUPPET, displayName: `User ${PUPPET}` })
    await assertSucceeds(b.commit())
    const again = writeBatch(f)
    again.set(doc(f, 'users', PUPPET, 'private', 'contact'), CONTACT(PUPPET, 'FFFFFFFF'))
    again.set(doc(f, 'friendCodes', 'FFFFFFFF'), { uid: PUPPET, displayName: `User ${PUPPET}` })
    await assertFails(again.commit()) // second code for the same user
  })

  it('admins list profiles and read every contact (the admin Users screen)', async () => {
    await assertSucceeds(getDocs(collection(db(ADMIN), 'users')))
    await assertSucceeds(getDocs(collectionGroup(db(ADMIN), 'private')))
  })
})

// ====================================================================================
// JOIN CODES
// ====================================================================================
describe('attack: join codes', () => {
  const code = (orgId: string, extra: Record<string, unknown> = {}) => ({ orgId, createdByUid: O1, createdAt: 5, active: true, ...extra })
  const joined = (uid: string, c: string, extra: Record<string, unknown> = {}) =>
    memberDoc(uid, { approvedByUid: O1, approvedAt: 9, joinCode: c, ...extra })

  it('only an approved officer of an approved org can issue a code, for their own org', async () => {
    // Each attempt uses a fresh code id: re-writing an existing id is an UPDATE, which officers may legitimately do.
    await assertFails(setDoc(doc(db(P1), 'joinCodes', 'QQQQQQQ2'), code('orgP', { createdByUid: P1 }))) // org still pending
    await assertFails(setDoc(doc(db(O1), 'joinCodes', 'QQQQQQQ3'), code('orgB'))) // someone else’s org
    await assertFails(setDoc(doc(db(M1), 'joinCodes', 'QQQQQQQ4'), code('orgA', { createdByUid: M1 }))) // a mere member
    await assertFails(setDoc(doc(db(X), 'joinCodes', 'QQQQQQQ5'), code('orgA', { createdByUid: X })))
    await assertFails(setDoc(doc(db(O1), 'joinCodes', 'QQQQQQQ6'), code('orgA', { createdByUid: M1 }))) // forged issuer
    await assertFails(setDoc(doc(db(O1), 'joinCodes', 'QQQQQQQ7'), code('orgA', { active: false })))
    await assertFails(setDoc(doc(db(O1), 'joinCodes', 'QQQQQQQ8'), { ...code('orgA'), extra: 'x' }))
    await assertFails(setDoc(doc(db(O1), 'joinCodes', 'short'), code('orgA')))
    await assertSucceeds(setDoc(doc(db(O1), 'joinCodes', 'NNNNNNNN'), code('orgA')))
  })

  it('only that org’s officers can list codes or switch one off; a code cannot be repurposed', async () => {
    await assertSucceeds(getDocs(query(collection(db(O1), 'joinCodes'), where('orgId', '==', 'orgA'))))
    await assertFails(getDocs(query(collection(db(M2), 'joinCodes'), where('orgId', '==', 'orgA'))))
    await assertFails(getDocs(collection(db(O1), 'joinCodes')))
    await assertSucceeds(getDoc(doc(db(M2), 'joinCodes', 'JJJJJJJJ'))) // holding the code is enough to read it
    await assertFails(updateDoc(doc(db(M1), 'joinCodes', 'JJJJJJJJ'), { active: false }))
    await assertFails(updateDoc(doc(db(O1), 'joinCodes', 'JJJJJJJJ'), { orgId: 'orgB' })) // cannot repoint it
    await assertFails(updateDoc(doc(db(O1), 'joinCodes', 'JJJJJJJJ'), { createdByUid: M2 }))
    await assertSucceeds(updateDoc(doc(db(O1), 'joinCodes', 'JJJJJJJJ'), { active: false }))
  })

  it('a code only admits you to ITS org, while it is live, as a plain member', async () => {
    const f = db(M2)
    await assertFails(setDoc(doc(f, 'organizations', 'orgB', 'members', M2), joined(M2, 'JJJJJJJJ'))) // orgA’s code, orgB’s door
    await assertFails(setDoc(doc(f, 'organizations', 'orgA', 'members', M2), joined(M2, 'KKKKKKKK'))) // switched off
    await assertFails(setDoc(doc(f, 'organizations', 'orgA', 'members', M2), joined(M2, 'ZZZZZZZZ'))) // does not exist
    await assertFails(setDoc(doc(f, 'organizations', 'orgP', 'members', M2), joined(M2, 'PPPPPPPP'))) // org not approved
    await assertFails(setDoc(doc(f, 'organizations', 'orgA', 'members', M2), joined(M2, 'JJJJJJJJ', { roleInOrg: 'officer' })))
    await assertFails(setDoc(doc(f, 'organizations', 'orgA', 'members', M2), joined(M2, 'JJJJJJJJ', { totalHoursApprovedForOrg: 20 })))
    await assertFails(setDoc(doc(f, 'organizations', 'orgA', 'members', M2), joined(M2, 'JJJJJJJJ', { approvedByUid: M2 }))) // cannot approve yourself
    await assertFails(setDoc(doc(f, 'organizations', 'orgA', 'members', M2), memberDoc(M2))) // no code at all
  })

  it('rejected or removed people cannot use a code to bypass the officer who turned them away', async () => {
    await env.withSecurityRulesDisabled(async (c) => {
      const f = c.firestore()
      await setDoc(doc(f, 'organizations', 'orgA', 'members', 'rejectee'), memberDoc('rejectee', { status: 'rejected' }))
      await setDoc(doc(f, 'organizations', 'orgA', 'members', 'removee'), memberDoc('removee', { status: 'removed' }))
    })
    await assertFails(setDoc(doc(db('rejectee'), 'organizations', 'orgA', 'members', 'rejectee'), joined('rejectee', 'JJJJJJJJ')))
    await assertFails(setDoc(doc(db('removee'), 'organizations', 'orgA', 'members', 'removee'), joined('removee', 'JJJJJJJJ')))
  })

  it('a code can neither promote an existing member to officer nor lift the hours total', async () => {
    await assertFails(setDoc(doc(db(M1), 'organizations', 'orgA', 'members', M1), joined(M1, 'JJJJJJJJ', { roleInOrg: 'officer' })))
    await assertFails(setDoc(doc(db(M1), 'organizations', 'orgA', 'members', M1), joined(M1, 'JJJJJJJJ', { totalHoursApprovedForOrg: 99 })))
  })
})

describe('happy path: join codes', () => {
  const joined = (uid: string, c: string) => memberDoc(uid, { approvedByUid: O1, approvedAt: 9, joinCode: c })

  it('a volunteer holding a live code joins immediately', async () => {
    await assertSucceeds(setDoc(doc(db(M2), 'organizations', 'orgA', 'members', M2), joined(M2, 'JJJJJJJJ')))
    // ...and can now log hours with the org.
    await assertSucceeds(setDoc(doc(db(M2), 'hourLogs', 'viaCode'), logDoc('viaCode', M2, 'orgA')))
  })

  it('a pending applicant is upgraded by presenting a code', async () => {
    await env.withSecurityRulesDisabled((c) =>
      setDoc(doc(c.firestore(), 'organizations', 'orgA', 'members', 'waiting'), memberDoc('waiting', { status: 'applied', approvedAt: null, approvedByUid: null })),
    )
    await assertSucceeds(setDoc(doc(db('waiting'), 'organizations', 'orgA', 'members', 'waiting'), joined('waiting', 'JJJJJJJJ')))
  })

  it('an officer replaces a code in one atomic batch: old one off, new one on', async () => {
    const f = db(O1)
    const b = writeBatch(f)
    b.update(doc(f, 'joinCodes', 'JJJJJJJJ'), { active: false })
    b.set(doc(f, 'joinCodes', 'NNNNNNNN'), { orgId: 'orgA', createdByUid: O1, createdAt: 9, active: true })
    await assertSucceeds(b.commit())
    await assertFails(setDoc(doc(db(M2), 'organizations', 'orgA', 'members', M2), joined(M2, 'JJJJJJJJ'))) // old code is dead
    await assertSucceeds(setDoc(doc(db(M2), 'organizations', 'orgA', 'members', M2), joined(M2, 'NNNNNNNN')))
  })
})

// ====================================================================================
// EMAIL VERIFICATION SWITCH. Off by default (so deploying rules cannot lock out existing
// unverified users). When flipped on, every create must come from a verified address.
// ====================================================================================
describe('email verification switch', () => {
  let strict: RulesTestEnvironment
  beforeAll(async () => {
    const enforced = RULES.replace(
      /function enforceEmailVerification\(\) \{\s*return false;\s*\}/,
      'function enforceEmailVerification() { return true; }',
    )
    if (enforced === RULES) throw new Error('enforceEmailVerification() not found in firestore.rules')
    strict = await initializeTestEnvironment({ projectId: 'demo-vetwork-rules-strict', firestore: { rules: enforced } })
  })
  afterAll(async () => {
    await strict.cleanup()
  })
  beforeEach(async () => {
    await strict.clearFirestore()
    await strict.withSecurityRulesDisabled(async (c) => {
      const f = c.firestore()
      await setDoc(doc(f, 'users', M1), profile(M1))
      await setDoc(doc(f, 'organizations', 'orgA'), orgDoc('orgA', { status: 'approved', submittedByUid: O1 }))
      await setDoc(doc(f, 'organizations', 'orgA', 'members', M1), memberDoc(M1))
    })
  })

  it('signup itself is always allowed (the user cannot be verified yet)', async () => {
    const f = strict.authenticatedContext('fresh', { email: 'fresh@x.test', email_verified: false }).firestore()
    await assertSucceeds(setDoc(doc(f, 'users', 'fresh'), profile('fresh')))
  })

  it('unverified users cannot create logs; verified users can', async () => {
    const un = strict.authenticatedContext(M1, { email: `${M1}@x.test`, email_verified: false }).firestore()
    const ok = strict.authenticatedContext(M1, { email: `${M1}@x.test`, email_verified: true }).firestore()
    await assertFails(setDoc(doc(un, 'hourLogs', 'v1'), logDoc('v1', M1, 'orgA')))
    await assertSucceeds(setDoc(doc(ok, 'hourLogs', 'v1'), logDoc('v1', M1, 'orgA')))
  })
})
