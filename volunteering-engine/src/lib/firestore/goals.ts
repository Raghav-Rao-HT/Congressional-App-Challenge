import { collection, doc, getDocs, onSnapshot, query, setDoc, where } from 'firebase/firestore'
import { db } from '../firebase'
import type { Goal } from '../../types/models'

export function subscribeMyGoals(uid: string, onChange: (goals: Goal[]) => void): () => void {
  return onSnapshot(collection(db, 'users', uid, 'goals'), (snapshot) => {
    onChange(snapshot.docs.map((d) => d.data() as Goal))
  })
}

export async function createGoal(params: {
  uid: string
  orgId: string | null
  targetHours: number
  periodStart: string
  periodEnd: string
}): Promise<void> {
  const ref = doc(collection(db, 'users', params.uid, 'goals'))
  await setDoc(ref, {
    goalId: ref.id,
    orgId: params.orgId,
    targetHours: params.targetHours,
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
    progressHours: 0,
    status: 'active',
    bonusPointsAwarded: false,
    bonusAmount: 0,
  } satisfies Goal)
}

export async function getActiveGoalsForMember(uid: string, orgId: string): Promise<Goal[]> {
  const q = query(collection(db, 'users', uid, 'goals'), where('status', '==', 'active'))
  const snapshot = await getDocs(q)
  return snapshot.docs
    .map((d) => d.data() as Goal)
    .filter((g) => g.orgId === null || g.orgId === orgId)
}
