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
} from 'firebase/firestore'
import { ApprovalError, planApproval } from '../approval'
import { db } from '../firebase'
import { getPetSpecies } from '../petVisuals'
import { getActiveGoalsForMember } from './goals'
import type { Goal, HourLog, OrgMember, Pet, UserProfile } from '../../types/models'

const MAX_SIGNATURE_DATA_URL_LENGTH = 300_000

export async function submitHourLog(params: {
  memberUid: string
  orgId: string
  petId: string
  date: string
  hours: number
  description: string
}): Promise<void> {
  const logRef = doc(collection(db, 'hourLogs'))

  // File attachments aren't supported: the project has no Cloud Storage
  // bucket (Spark plan), so the field stays as an always-empty list.
  await setDoc(logRef, {
    logId: logRef.id,
    memberUid: params.memberUid,
    orgId: params.orgId,
    petId: params.petId,
    date: params.date,
    hours: params.hours,
    description: params.description,
    attachmentURLs: [],
    status: 'pending',
    submittedAt: Date.now(),
    reviewedAt: null,
    reviewedByUid: null,
    rejectionReason: null,
    signatureURL: null,
    pointsAwarded: null,
  } satisfies HourLog)
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

// Approves an hour log and applies everything that follows from it (the
// member's points and streak, their pet's hours, goal progress, the roster
// total) as ONE Firestore transaction: either all of it happens or none of
// it does, so a failure can never leave a half-approved log. Reads and the
// pure decision (planApproval) come first; nothing is written if the
// decision is a refusal (e.g. the volunteer never joined the organization).
//
// `hours`, `date` and `petId` are what the officer reviewed on screen. If the
// stored log no longer matches (the member edited it meanwhile), the approval
// is refused so the officer never signs off on numbers they didn't see.
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
  // The signature is saved on the hour log itself as a PNG data URL, since
  // there's no Cloud Storage bucket. A 400x150 hand signature is a few KB;
  // this cap only guards Firestore's 1 MiB document limit. Checked up front
  // so nothing is written for an oversized signature.
  if (params.signatureDataUrl.length > MAX_SIGNATURE_DATA_URL_LENGTH) {
    throw new ApprovalError('That signature is too large. Clear it and sign again with a simpler stroke.')
  }

  const petId = getPetSpecies(params.petId).id

  // A transaction can only read documents by path, not run queries, so the
  // member's candidate goals are found first and then re-read inside it.
  const goalCandidates = await getActiveGoalsForMember(params.memberUid, params.orgId)

  await runTransaction(db, async (tx) => {
    const logRef = doc(db, 'hourLogs', params.logId)
    const membershipRef = doc(db, 'organizations', params.orgId, 'members', params.memberUid)
    const userRef = doc(db, 'users', params.memberUid)
    const petRef = doc(db, 'users', params.memberUid, 'pets', petId)
    const goalRefs = goalCandidates.map((goal) => doc(db, 'users', params.memberUid, 'goals', goal.goalId))

    // All reads before any write.
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

    // All writes, applied together when the transaction commits.
    tx.update(logRef, {
      status: 'approved',
      reviewedAt: now,
      reviewedByUid: params.reviewerUid,
      signatureURL: params.signatureDataUrl,
      pointsAwarded: plan.pointsAwarded,
    })
    tx.update(membershipRef, { totalHoursApprovedForOrg: increment(params.hours) })
    tx.set(petRef, plan.pet, { merge: true })
    for (const result of plan.goals) {
      tx.update(doc(db, 'users', params.memberUid, 'goals', result.goalId), {
        progressHours: result.progressHours,
        status: result.status,
        bonusPointsAwarded: result.bonusPointsAwarded,
        bonusAmount: result.bonusAmount,
      })
    }
    tx.update(userRef, plan.member)
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
