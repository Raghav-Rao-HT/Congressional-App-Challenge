import { collection, doc, getDoc, onSnapshot, query, setDoc, updateDoc, where } from 'firebase/firestore'
import { normalizeCode } from '../codes'
import { db } from '../firebase'
import type { FriendCodeEntry, Friendship } from '../../types/models'

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

/**
 * Find someone by the friend code they gave you. There is deliberately no way to search by name or to list
 * users: a stranger can only reach a student who chose to hand them a code.
 */
export async function lookupFriendCode(input: string): Promise<{ uid: string; displayName: string } | null> {
  const code = normalizeCode(input)
  if (!code) return null
  const snapshot = await getDoc(doc(db, 'friendCodes', code))
  if (!snapshot.exists()) return null
  const entry = snapshot.data() as FriendCodeEntry
  return { uid: entry.uid, displayName: entry.displayName }
}
