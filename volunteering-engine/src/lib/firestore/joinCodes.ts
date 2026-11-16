import { collection, doc, getDoc, onSnapshot, query, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'
import { generateCode, normalizeCode } from '../codes'
import type { JoinCode, OrgMember } from '../../types/models'

export class JoinCodeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'JoinCodeError'
  }
}

export interface JoinCodeRow extends JoinCode {
  code: string
}

export function subscribeOrgJoinCodes(orgId: string, onChange: (codes: JoinCodeRow[]) => void): () => void {
  const q = query(collection(db, 'joinCodes'), where('orgId', '==', orgId))
  return onSnapshot(
    q,
    (snapshot) => {
      const codes = snapshot.docs.map((d) => ({ code: d.id, ...(d.data() as JoinCode) }))
      onChange(codes.sort((a, b) => b.createdAt - a.createdAt))
    },
    (error) => console.error('Could not load join codes:', error),
  )
}

/** Turn off any live codes for the org and issue a fresh one, so there is only ever one active code. */
export async function issueJoinCode(params: { orgId: string; officerUid: string; current: JoinCodeRow[] }): Promise<string> {
  let lastError: unknown
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const code = generateCode()
    const batch = writeBatch(db)
    params.current
      .filter((c) => c.active)
      .forEach((c) => batch.update(doc(db, 'joinCodes', c.code), { active: false }))
    batch.set(doc(db, 'joinCodes', code), {
      orgId: params.orgId,
      createdByUid: params.officerUid,
      createdAt: Date.now(),
      active: true,
    } satisfies JoinCode)
    try {
      await batch.commit()
      return code
    } catch (error) {
      lastError = error
    }
  }
  throw lastError
}

export async function turnOffJoinCode(code: string): Promise<void> {
  await updateDoc(doc(db, 'joinCodes', code), { active: false })
}

/**
 * Join an organization by presenting its join code. The trust comes from the officer who handed the code
 * out, so the volunteer is admitted straight away instead of waiting in the review queue. firestore.rules
 * re-check that the code is live, belongs to this org, and that the org is approved.
 */
export async function joinWithCode(params: {
  code: string
  uid: string
  displayName: string
}): Promise<{ orgId: string; alreadyMember: boolean }> {
  const code = normalizeCode(params.code)
  if (!code) throw new JoinCodeError('Enter the 8-character code your organization gave you.')

  const codeSnap = await getDoc(doc(db, 'joinCodes', code)).catch(() => null)
  const entry = codeSnap?.exists() ? (codeSnap.data() as JoinCode) : null
  if (!entry || !entry.active) throw new JoinCodeError("That code isn't valid, or it has been turned off.")

  const memberRef = doc(db, 'organizations', entry.orgId, 'members', params.uid)
  const existing = await getDoc(memberRef)
  const current = existing.exists() ? (existing.data() as OrgMember) : null
  if (current?.status === 'approved') return { orgId: entry.orgId, alreadyMember: true }
  if (current && current.status !== 'applied') {
    throw new JoinCodeError("A code can't be used to rejoin. Ask an officer of the organization to review your request.")
  }

  const now = Date.now()
  await setDoc(memberRef, {
    uid: params.uid,
    displayName: params.displayName,
    status: 'approved',
    roleInOrg: 'member',
    appliedAt: current?.appliedAt ?? now,
    approvedAt: now,
    approvedByUid: entry.createdByUid,
    totalHoursApprovedForOrg: 0,
    joinCode: code,
  } satisfies OrgMember)
  return { orgId: entry.orgId, alreadyMember: false }
}
