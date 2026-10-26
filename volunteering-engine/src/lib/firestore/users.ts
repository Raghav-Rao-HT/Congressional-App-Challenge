import { collection, deleteField, doc, getDoc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore'
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

export async function setLeaderboardHidden(uid: string, hidden: boolean): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { leaderboardHidden: hidden })
}

export function subscribeAllUsers(
  onChange: (users: UserProfile[]) => void,
  onError: (error: Error) => void,
): () => void {
  return onSnapshot(
    collection(db, 'users'),
    (snapshot) => onChange(snapshot.docs.map((d) => d.data() as UserProfile)),
    onError,
  )
}

export async function makeAdmin(user: UserProfile): Promise<void> {
  if (user.accountType !== 'member' && user.accountType !== 'organization_officer') return
  await updateDoc(doc(db, 'users', user.uid), { accountType: 'admin', roleBeforeAdmin: user.accountType })
}

export async function removeAdmin(user: UserProfile): Promise<void> {
  await updateDoc(doc(db, 'users', user.uid), {
    accountType: user.roleBeforeAdmin ?? 'member',
    roleBeforeAdmin: deleteField(),
  })
}

export async function setTestAccount(uid: string, isTestAccount: boolean): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { isTestAccount })
}
