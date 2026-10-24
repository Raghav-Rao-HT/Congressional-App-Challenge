import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthProvider'
import { applyToOrganization, getMyApplications } from '../lib/firestore/organizations'
import type { OrgMemberStatus } from '../types/models'

// The signed-in member's application status per organization, plus an
// apply() that joins one. Shared by the dashboard list, the map popups, the
// bulletin board and the log-hours form.
export function useOrgApplications() {
  const { user, profile } = useAuth()
  const [applications, setApplications] = useState<Record<string, OrgMemberStatus>>({})
  const [applyingTo, setApplyingTo] = useState<string | null>(null)
  // 'loading' until the first lookup finishes, so callers can tell "not
  // loaded yet" apart from "hasn't joined anything".
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    if (!user) return
    getMyApplications(user.uid)
      .then((apps) => {
        const statuses: Record<string, OrgMemberStatus> = {}
        Object.entries(apps).forEach(([orgId, m]) => {
          statuses[orgId] = m.status
        })
        setApplications(statuses)
        setLoadState('ready')
      })
      .catch((error) => {
        console.error('Could not load organization memberships:', error)
        setLoadState('error')
      })
  }, [user])

  async function apply(orgId: string) {
    if (!user || !profile) return
    setApplyingTo(orgId)
    try {
      await applyToOrganization({ orgId, uid: user.uid, displayName: profile.displayName })
      setApplications((prev) => ({ ...prev, [orgId]: 'applied' }))
    } finally {
      setApplyingTo(null)
    }
  }

  return { applications, applyingTo, apply, loadState }
}
