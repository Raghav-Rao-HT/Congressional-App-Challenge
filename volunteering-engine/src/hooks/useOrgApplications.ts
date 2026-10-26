import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthProvider'
import { applyToOrganization, getMyApplications } from '../lib/firestore/organizations'
import type { OrgMemberStatus } from '../types/models'

export function useOrgApplications() {
  const { user, profile } = useAuth()
  const [applications, setApplications] = useState<Record<string, OrgMemberStatus>>({})
  const [applyingTo, setApplyingTo] = useState<string | null>(null)
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
      const autoApprove = !!profile.isTestAccount
      await applyToOrganization({ orgId, uid: user.uid, displayName: profile.displayName, autoApprove })
      setApplications((prev) => ({ ...prev, [orgId]: autoApprove ? 'approved' : 'applied' }))
    } finally {
      setApplyingTo(null)
    }
  }

  return { applications, applyingTo, apply, loadState }
}
