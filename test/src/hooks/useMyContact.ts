import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthProvider'
import { ensureMyContact } from '../lib/firestore/contacts'
import type { UserContact } from '../types/models'

/** The signed-in user's private contact details and friend code. Accounts that predate the privacy split get theirs created here. */
export function useMyContact(): { contact: UserContact | null; error: boolean } {
  const { user, profile } = useAuth()
  const [contact, setContact] = useState<UserContact | null>(null)
  const [error, setError] = useState(false)

  const uid = user?.uid
  const email = user?.email
  const displayName = profile?.displayName

  useEffect(() => {
    if (!uid || !email || !displayName) return
    let cancelled = false
    ensureMyContact({ uid, email, displayName })
      .then((result) => !cancelled && setContact(result))
      .catch((err) => {
        console.error('Could not load your friend code:', err)
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [uid, email, displayName])

  return { contact, error }
}
