import { useEffect, useMemo, useState } from 'react'
import { subscribeAllContacts } from '../lib/firestore/contacts'
import { subscribeAllUsers } from '../lib/firestore/users'
import type { AdminUser, UserContact, UserProfile } from '../types/models'

/**
 * ADMIN SCREENS ONLY. Listing every profile, and reading every private contact document, is something
 * firestore.rules allow admins and nobody else. Emails come from the private contact document; the
 * legacy `email` field on old profiles is used only until scripts/migrateEmails.mjs has been run.
 */
export function useAllUsers(): { users: AdminUser[] | null; error: string | null } {
  const [profiles, setProfiles] = useState<UserProfile[] | null>(null)
  const [contacts, setContacts] = useState<Map<string, UserContact> | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(
    () =>
      subscribeAllUsers(setProfiles, (err) => {
        console.error('Could not load the accounts:', err)
        setError('Could not load the list of accounts.')
      }),
    [],
  )

  useEffect(
    () =>
      subscribeAllContacts(setContacts, (err) => {
        console.error('Could not load the contact details:', err)
        setError('Could not load the list of accounts.')
      }),
    [],
  )

  const users = useMemo(() => {
    if (!profiles || !contacts) return null
    return profiles.map((profile) => ({ ...profile, email: contacts.get(profile.uid)?.email ?? profile.email ?? '' }))
  }, [profiles, contacts])

  return { users, error }
}
