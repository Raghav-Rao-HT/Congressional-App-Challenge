import {
  collection,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
  type Transaction,
} from 'firebase/firestore'
import { ApprovalError, planApproval, type ApprovalPlan } from '../approval'
import { db } from '../firebase'
import { getPetSpecies } from '../petVisuals'
import { getActiveGoalsForMember } from './goals'
import type { Goal, HourLog, OrgMember, Pet, UserProfile } from '../../types/models'

const MAX_SIGNATURE_DATA_URL_LENGTH = 300_000

interface SubmitHourLogParams {
  memberUid: string
  orgId: string
  petId: string
  date: string
  hours: number
  description: string
  attachment?: string | null
}

function newHourLog(logId: string, params: SubmitHourLogParams): HourLog {
  return {
    logId,
    memberUid: params.memberUid,
    orgId: params.orgId,
    petId: params.petId,
    date: params.date,
    hours: params.hours,
    description: params.description,
    attachmentURLs: params.attachment ? [params.attachment] : [],
    status: 'pending',
    submittedAt: Date.now(),
    reviewedAt: null,
    reviewedByUid: null,
    rejectionReason: null,
    signatureURL: null,
    pointsAwarded: null,
    replyImageURL: null,
    replyAt: null,
  }
}

export async function submitHourLog(params: SubmitHourLogParams): Promise<void> {
  const logRef = doc(collection(db, 'hourLogs'))
  await setDoc(logRef, newHourLog(logRef.id, params))
}

function applyApprovalPlan(
  tx: Transaction,
  params: { memberUid: string; orgId: string; hours: number },
  plan: ApprovalPlan,
) {
  tx.update(doc(db, 'organizations', params.orgId, 'members', params.memberUid), {
    totalHoursApprovedForOrg: increment(params.hours),
  })
  tx.set(doc(db, 'users', params.memberUid, 'pets', plan.pet.species), plan.pet, { merge: true })
  for (const result of plan.goals) {
    tx.update(doc(db, 'users', params.memberUid, 'goals', result.goalId), {
      progressHours: result.progressHours,
      status: result.status,
      bonusPointsAwarded: result.bonusPointsAwarded,
      bonusAmount: result.bonusAmount,
    })
  }
  tx.update(doc(db, 'users', params.memberUid), plan.member)
}

export async function submitAutoApprovedHourLog(params: SubmitHourLogParams): Promise<void> {
  const logRef = doc(collection(db, 'hourLogs'))
  const petId = getPetSpecies(params.petId).id
  const goalCandidates = await getActiveGoalsForMember(params.memberUid, params.orgId)

  await runTransaction(db, async (tx) => {
    const membershipRef = doc(db, 'organizations', params.orgId, 'members', params.memberUid)
    const userRef = doc(db, 'users', params.memberUid)
    const petRef = doc(db, 'users', params.memberUid, 'pets', petId)

    const [membershipSnap, userSnap, petSnap] = await Promise.all([tx.get(membershipRef), tx.get(userRef), tx.get(petRef)])
    const goalSnaps = await Promise.all(
      goalCandidates.map((goal) => tx.get(doc(db, 'users', params.memberUid, 'goals', goal.goalId))),
    )

    const log = newHourLog(logRef.id, { ...params, petId })
    const now = Date.now()
    const plan = planApproval({
      hours: params.hours,
      date: params.date,
      petId,
      orgId: params.orgId,
      logStatus: log.status,
      membershipStatus: membershipSnap.exists() ? (membershipSnap.data() as OrgMember).status : null,
      member: userSnap.exists() ? (userSnap.data() as UserProfile) : null,
      pet: petSnap.exists() ? (petSnap.data() as Pet) : null,
      goals: goalSnaps.filter((snap) => snap.exists()).map((snap) => snap.data() as Goal),
      now,
    })

    tx.set(logRef, {
      ...log,
      status: 'approved',
      reviewedAt: now,
      reviewedByUid: params.memberUid,
      pointsAwarded: plan.pointsAwarded,
      autoApproved: true,
    } satisfies HourLog)
    applyApprovalPlan(tx, params, plan)
  })
}

export function subscribeMyHourLogs(memberUid: string, onChange: (logs: HourLog[]) => void): () => void {
  const q = query(
    collection(db, 'hourLogs'),
    where('memberUid', '==', memberUid),
    orderBy('submittedAt', 'desc'),
  )
  return onSnapshot(q, (snapshot) => {
    onChange(snapshot.docs.map((d) => d.data() as HourLog))
  })
}

export function subscribeOrgReviewedHourLogs(orgId: string, onChange: (logs: HourLog[]) => void, max = 10): () => void {
  const byStatus: Record<string, HourLog[]> = { approved: [], rejected: [] }
  const publish = () =>
    onChange([...byStatus.approved, ...byStatus.rejected].sort((a, b) => (b.reviewedAt ?? 0) - (a.reviewedAt ?? 0)).slice(0, max))
  const listeners = (['approved', 'rejected'] as const).map((status) =>
    onSnapshot(
      query(collection(db, 'hourLogs'), where('orgId', '==', orgId), where('status', '==', status)),
      (snapshot) => {
        byStatus[status] = snapshot.docs.map((d) => d.data() as HourLog)
        publish()
      },
      (error) => console.error(`Reviewed ${status} hour logs failed:`, error),
    ),
  )
  return () => listeners.forEach((unsubscribe) => unsubscribe())
}

export async function sendReplyImage(logId: string, dataUrl: string): Promise<void> {
  await updateDoc(doc(db, 'hourLogs', logId), { replyImageURL: dataUrl, replyAt: Date.now() })
}

export function subscribeOrgPendingHourLogs(orgId: string, onChange: (logs: HourLog[]) => void): () => void {
  const q = query(
    collection(db, 'hourLogs'),
    where('orgId', '==', orgId),
    where('status', '==', 'pending'),
    orderBy('submittedAt', 'asc'),
  )
  return onSnapshot(q, (snapshot) => {
    onChange(snapshot.docs.map((d) => d.data() as HourLog))
  })
}

export async function approveHourLog(params: {
  logId: string
  orgId: string
  memberUid: string
  petId: string
  hours: number
  date: string
  reviewerUid: string
  signatureDataUrl: string
}): Promise<void> {
  if (params.signatureDataUrl.length > MAX_SIGNATURE_DATA_URL_LENGTH) {
    throw new ApprovalError('That signature is too large. Clear it and sign again with a simpler stroke.')
  }

  const petId = getPetSpecies(params.petId).id

  const goalCandidates = await getActiveGoalsForMember(params.memberUid, params.orgId)

  await runTransaction(db, async (tx) => {
    const logRef = doc(db, 'hourLogs', params.logId)
    const membershipRef = doc(db, 'organizations', params.orgId, 'members', params.memberUid)
    const userRef = doc(db, 'users', params.memberUid)
    const petRef = doc(db, 'users', params.memberUid, 'pets', petId)
    const goalRefs = goalCandidates.map((goal) => doc(db, 'users', params.memberUid, 'goals', goal.goalId))

    const [logSnap, membershipSnap, userSnap, petSnap] = await Promise.all([
      tx.get(logRef),
      tx.get(membershipRef),
      tx.get(userRef),
      tx.get(petRef),
    ])
    const goalSnaps = await Promise.all(goalRefs.map((ref) => tx.get(ref)))

    if (!logSnap.exists()) throw new ApprovalError('This submission no longer exists.')
    const log = logSnap.data() as HourLog
    if (log.orgId !== params.orgId || log.memberUid !== params.memberUid) {
      throw new ApprovalError('This submission does not belong to your organization.')
    }
    if (log.hours !== params.hours || log.date !== params.date || (log.petId ?? petId) !== petId) {
      throw new ApprovalError(
        'This submission changed while you were reviewing it. Reload the page and review it again.',
      )
    }

    const now = Date.now()
    const plan = planApproval({
      hours: params.hours,
      date: params.date,
      petId,
      orgId: params.orgId,
      logStatus: log.status,
      membershipStatus: membershipSnap.exists() ? (membershipSnap.data() as OrgMember).status : null,
      member: userSnap.exists() ? (userSnap.data() as UserProfile) : null,
      pet: petSnap.exists() ? (petSnap.data() as Pet) : null,
      goals: goalSnaps.filter((snap) => snap.exists()).map((snap) => snap.data() as Goal),
      now,
    })

    tx.update(logRef, {
      status: 'approved',
      reviewedAt: now,
      reviewedByUid: params.reviewerUid,
      signatureURL: params.signatureDataUrl,
      pointsAwarded: plan.pointsAwarded,
    })
    applyApprovalPlan(tx, params, plan)
  })
}

export async function rejectHourLog(params: {
  logId: string
  reviewerUid: string
  reason: string
}): Promise<void> {
  await updateDoc(doc(db, 'hourLogs', params.logId), {
    status: 'rejected',
    reviewedAt: Date.now(),
    reviewedByUid: params.reviewerUid,
    rejectionReason: params.reason,
  })
}
