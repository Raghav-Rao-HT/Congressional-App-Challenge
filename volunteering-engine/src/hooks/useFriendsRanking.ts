import { doc, getDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'
import { subscribeMyFriendships } from '../lib/firestore/friendships'
import type { Friendship } from '../types/models'

export interface FriendRanking {
  uid: string
  displayName: string
  totalPoints: number
  totalHoursApproved: number
}

function otherUid(friendship: Friendship, myUid: string): string {
  return friendship.participants.find((p) => p !== myUid) ?? friendship.participants[0]
}

export function useFriendsRanking(myUid: string | undefined): {
  friendships: Friendship[]
  profiles: Record<string, FriendRanking>
  ranked: FriendRanking[]
} {
  const [friendships, setFriendships] = useState<Friendship[]>([])
  const [profiles, setProfiles] = useState<Record<string, FriendRanking>>({})

  useEffect(() => {
    if (!myUid) return
    return subscribeMyFriendships(myUid, setFriendships)
  }, [myUid])

  useEffect(() => {
    if (!myUid) return
    const missing = friendships.map((f) => otherUid(f, myUid)).filter((uid) => !(uid in profiles))
    if (missing.length === 0) return
    Promise.all(
      missing.map(async (uid) => {
        const snap = await getDoc(doc(db, 'users', uid))
        const data = snap.data()
        return [
          uid,
          {
            uid,
            displayName: (data?.displayName as string) ?? uid,
            totalPoints: (data?.totalPoints as number) ?? 0,
            totalHoursApproved: (data?.totalHoursApproved as number) ?? 0,
          },
        ] as const
      }),
    ).then((entries) => {
      setProfiles((prev) => ({ ...prev, ...Object.fromEntries(entries) }))
    })
  }, [friendships, myUid, profiles])

  const ranked = myUid
    ? friendships
        .filter((f) => f.status === 'accepted')
        .map((f) => profiles[otherUid(f, myUid)])
        .filter((p): p is FriendRanking => !!p)
        .sort((a, b) => b.totalPoints - a.totalPoints)
    : []

  return { friendships, profiles, ranked }
}

export { otherUid }
