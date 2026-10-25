import { collection, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import type { UserProfile } from '../../types/models'

// Top members by points. Members an admin has hidden are left out unless
// `includeHidden` is set (admins see them so they can restore them). Firestore
// can't filter on a field most profiles don't have, so a few extra rows are
// fetched and the hidden ones are dropped here, keeping the list near `max`.
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
    onChange(options.includeHidden ? members : members.filter((m) => !m.leaderboardHidden).slice(0, max))
  })
}
