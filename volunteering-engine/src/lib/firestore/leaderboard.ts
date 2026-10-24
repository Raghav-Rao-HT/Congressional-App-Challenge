import { collection, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import type { UserProfile } from '../../types/models'

export function subscribeTopMembers(
  onChange: (members: UserProfile[]) => void,
  options: { state?: string; max?: number } = {},
): () => void {
  const clauses = [where('accountType', '==', 'member')]
  if (options.state) clauses.push(where('homeState', '==', options.state))
  const q = query(collection(db, 'users'), ...clauses, orderBy('totalPoints', 'desc'), limit(options.max ?? 50))
  return onSnapshot(q, (snapshot) => {
    onChange(snapshot.docs.map((d) => d.data() as UserProfile))
  })
}
