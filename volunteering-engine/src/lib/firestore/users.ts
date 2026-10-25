import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import type { AccountType, UserProfile } from '../../types/models'

export async function createUserProfile(params: {
  uid: string
  email: string
  displayName: string
  homeState: string
  accountType: AccountType
  nonprofitType?: string
  irsClassification?: string
}): Promise<void> {
  const ref = doc(db, 'users', params.uid)
  const now = Date.now()
  await setDoc(ref, {
    uid: params.uid,
    email: params.email,
    displayName: params.displayName,
    homeState: params.homeState,
    accountType: params.accountType,
    nonprofitType: params.nonprofitType ?? null,
    irsClassification: params.irsClassification ?? null,
    orgId: null,
    totalPoints: 0,
    totalHoursApproved: 0,
    currentStreakWeeks: 0,
    longestStreakWeeks: 0,
    lastServiceDate: null,
    createdAt: now,
    lastActiveAt: now,
  } satisfies UserProfile)
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const ref = doc(db, 'users', uid)
  const snapshot = await getDoc(ref)
  if (!snapshot.exists()) return null
  return snapshot.data() as UserProfile
}

// Admin only (the security rules allow an admin to touch just this field and
// orgId on someone else's profile). Hiding is reversible and keeps the
// member's points, hours and account intact.
export async function setLeaderboardHidden(uid: string, hidden: boolean): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { leaderboardHidden: hidden })
}
