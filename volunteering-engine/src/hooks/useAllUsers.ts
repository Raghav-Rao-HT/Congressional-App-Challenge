import { useEffect, useState } from 'react'
import { subscribeAllUsers } from '../lib/firestore/users'
import type { UserProfile } from '../types/models'

export function useAllUsers(): { users: UserProfile[] | null; error: string | null } {
  const [users, setUsers] = useState<UserProfile[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(
    () =>
      subscribeAllUsers(setUsers, (err) => {
        console.error('Could not load the accounts:', err)
        setError('Could not load the list of accounts.')
      }),
    [],
  )

  return { users, error }
}
