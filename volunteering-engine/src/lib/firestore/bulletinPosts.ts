import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase'
import type { BulletinAudience, BulletinPost } from '../../types/models'

export async function createBulletinPost(params: {
  authorUid: string
  authorType: 'member' | 'org'
  orgId: string | null
  audience: BulletinAudience
  offersServiceHours: boolean
  title: string
  description: string
  startAt: number
  endAt: number
  location: { address: string; city: string; state: string }
  tags: string[]
}): Promise<void> {
  const ref = doc(collection(db, 'bulletinPosts'))
  await setDoc(ref, {
    postId: ref.id,
    authorUid: params.authorUid,
    authorType: params.authorType,
    orgId: params.orgId,
    audience: params.audience,
    offersServiceHours: params.offersServiceHours,
    approvedCount: 0,
    title: params.title,
    description: params.description,
    startAt: params.startAt,
    endAt: params.endAt,
    location: params.location,
    tags: params.tags,
    status: 'open',
    createdAt: Date.now(),
  } satisfies BulletinPost)
}

export function subscribeBulletinPosts(
  memberOrgIds: string[],
  onChange: (posts: BulletinPost[]) => void,
  filterState?: string,
): () => void {
  const bySource = new Map<string, BulletinPost[]>()

  function publish() {
    const merged = new Map<string, BulletinPost>()
    bySource.forEach((posts) => posts.forEach((post) => merged.set(post.postId, post)))
    onChange(
      [...merged.values()]
        .filter((post) => !filterState || post.location.state === filterState)
        .sort((a, b) => a.startAt - b.startAt),
    )
  }

  function listen(source: string, q: ReturnType<typeof query>) {
    return onSnapshot(
      q,
      (snapshot) => {
        bySource.set(source, snapshot.docs.map((d) => d.data() as BulletinPost))
        publish()
      },
      (error) => console.error(`Bulletin query "${source}" failed:`, error),
    )
  }

  const postsRef = collection(db, 'bulletinPosts')
  const unsubscribers = [
    listen(
      'public',
      query(postsRef, where('audience', '==', 'public'), where('status', '==', 'open'), orderBy('startAt', 'asc')),
    ),
    ...memberOrgIds.map((orgId) =>
      listen(
        `org:${orgId}`,
        query(postsRef, where('orgId', '==', orgId), where('status', '==', 'open'), orderBy('startAt', 'asc')),
      ),
    ),
  ]

  return () => unsubscribers.forEach((unsubscribe) => unsubscribe())
}

export function subscribeAllBulletinPosts(
  onChange: (posts: BulletinPost[]) => void,
  onError: (error: Error) => void,
): () => void {
  return onSnapshot(
    query(collection(db, 'bulletinPosts'), orderBy('startAt', 'desc')),
    (snapshot) => onChange(snapshot.docs.map((d) => d.data() as BulletinPost)),
    onError,
  )
}

export async function deleteBulletinPost(postId: string): Promise<void> {
  const rsvps = await getDocs(collection(db, 'bulletinPosts', postId, 'rsvps'))
  for (let start = 0; start < rsvps.docs.length; start += 400) {
    const batch = writeBatch(db)
    rsvps.docs.slice(start, start + 400).forEach((rsvp) => batch.delete(rsvp.ref))
    await batch.commit()
  }
  await deleteDoc(doc(db, 'bulletinPosts', postId))
}
