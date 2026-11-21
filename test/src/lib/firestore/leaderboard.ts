import { collection, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import type { UserProfile } from '../../types/models'

export function subscribeTopMembers(
  onChange: (members: UserProfile[]) => void,
  options: { state?: string; max?: number; includeHidden?: boolean } = {},
): () => void {
  const max = options.max ?? 50
  const clauses = [where('accountType', '==', 'member')]
  if (options.state) clauses.push(where('homeState', '==', options.state))
  const q = query(collection(db, 'users'), ...clauses, orderBy('totalPoints', 'desc'), limit(max * 2))
  return onSnapshot(q, (snapshot) => {
    const members = snapshot.docs.map((d) => d.data() as UserProfile)
    onChange(
      options.includeHidden ? members : members.filter((m) => !m.leaderboardHidden && !m.isTestAccount).slice(0, max),
    )
  })
}
