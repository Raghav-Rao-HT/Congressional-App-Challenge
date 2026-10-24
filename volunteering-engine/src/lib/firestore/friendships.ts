import {
  collection,
  doc,
  endAt,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  startAt,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firebase'
import type { Friendship } from '../../types/models'

function friendshipDocId(uidA: string, uidB: string): string {
  return [uidA, uidB].sort().join('_')
}

export async function sendFriendRequest(fromUid: string, toUid: string): Promise<void> {
  const id = friendshipDocId(fromUid, toUid)
  const participants: [string, string] = fromUid < toUid ? [fromUid, toUid] : [toUid, fromUid]
  await setDoc(doc(db, 'friendships', id), {
    participants,
    requesterUid: fromUid,
    recipientUid: toUid,
    status: 'pending',
    createdAt: Date.now(),
    respondedAt: null,
  } satisfies Friendship)
}

export function subscribeMyFriendships(
  uid: string,
  onChange: (friendships: Friendship[]) => void,
): () => void {
  const q = query(collection(db, 'friendships'), where('participants', 'array-contains', uid))
  return onSnapshot(q, (snapshot) => {
    onChange(snapshot.docs.map((d) => d.data() as Friendship))
  })
}

export async function respondToFriendRequest(params: {
  fromUid: string
  toUid: string
  accept: boolean
}): Promise<void> {
  const id = friendshipDocId(params.fromUid, params.toUid)
  await updateDoc(doc(db, 'friendships', id), {
    status: params.accept ? 'accepted' : 'declined',
    respondedAt: Date.now(),
  })
}

export async function searchMembersByName(
  prefix: string,
): Promise<{ uid: string; displayName: string }[]> {
  if (!prefix.trim()) return []
  const q = query(
    collection(db, 'users'),
    where('accountType', '==', 'member'),
    orderBy('displayName'),
    startAt(prefix),
    endAt(prefix + ''),
    limit(10),
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ uid: d.id, displayName: d.data().displayName as string }))
}
