import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import type { AccountType, UserProfile } from '../../types/models'

export async function createUserProfile(params: {
  uid: string
  email: string
  displayName: string
  homeState: string
  accountType: AccountType
  nonprofitType?: string
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
