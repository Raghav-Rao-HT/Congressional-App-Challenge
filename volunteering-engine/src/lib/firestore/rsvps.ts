import {
  collection,
  deleteDoc,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase'
import type { Rsvp } from '../../types/models'

function rsvpRef(postId: string, uid: string) {
  return doc(db, 'bulletinPosts', postId, 'rsvps', uid)
}

export async function rsvpToPost(params: {
  postId: string
  uid: string
  displayName: string
  autoApprove?: boolean
}): Promise<void> {
  if (params.autoApprove) {
    const now = Date.now()
    const batch = writeBatch(db)
    batch.set(rsvpRef(params.postId, params.uid), {
      uid: params.uid,
      displayName: params.displayName,
      status: 'approved',
      createdAt: now,
      decidedAt: now,
    } satisfies Rsvp)
    batch.update(doc(db, 'bulletinPosts', params.postId), { approvedCount: increment(1) })
    await batch.commit()
    return
  }
  await setDoc(rsvpRef(params.postId, params.uid), {
    uid: params.uid,
    displayName: params.displayName,
    status: 'pending',
    createdAt: Date.now(),
    decidedAt: null,
  } satisfies Rsvp)
}

export async function cancelRsvp(postId: string, uid: string): Promise<void> {
  await deleteDoc(rsvpRef(postId, uid))
}

export function subscribeMyRsvp(
  postId: string,
  uid: string,
  onChange: (rsvp: Rsvp | null) => void,
): () => void {
  return onSnapshot(
    rsvpRef(postId, uid),
    (snapshot) => onChange(snapshot.exists() ? (snapshot.data() as Rsvp) : null),
    (error) => console.error('RSVP lookup failed:', error),
  )
}

export function subscribePostRsvps(postId: string, onChange: (rsvps: Rsvp[]) => void): () => void {
  const q = query(collection(db, 'bulletinPosts', postId, 'rsvps'), orderBy('createdAt', 'asc'))
  return onSnapshot(
    q,
    (snapshot) => onChange(snapshot.docs.map((d) => d.data() as Rsvp)),
    (error) => console.error('RSVP list failed:', error),
  )
}

export async function decideRsvp(params: {
  postId: string
  rsvpUid: string
  status: 'approved' | 'declined'
}): Promise<void> {
  const rsvp = rsvpRef(params.postId, params.rsvpUid)
  const post = doc(db, 'bulletinPosts', params.postId)

  await runTransaction(db, async (tx) => {
    const snapshot = await tx.get(rsvp)
    if (!snapshot.exists()) throw new Error('That RSVP no longer exists.')
    const previous = (snapshot.data() as Rsvp).status
    if (previous === params.status) return

    const delta = params.status === 'approved' ? 1 : previous === 'approved' ? -1 : 0
    tx.update(rsvp, { status: params.status, decidedAt: Date.now() })
    if (delta !== 0) tx.update(post, { approvedCount: increment(delta) })
  })
}
