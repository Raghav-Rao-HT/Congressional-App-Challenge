import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthProvider'
import { subscribeMyOrganization } from '../lib/firestore/organizations'
import type { Organization } from '../types/models'

export function useMyOrganization(): { org: Organization | null; loading: boolean } {
  const { user } = useAuth()
  const [org, setOrg] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setOrg(null)
      setLoading(false)
      return
    }
    setLoading(true)
    return subscribeMyOrganization(user.uid, (next) => {
      setOrg(next)
      setLoading(false)
    })
  }, [user])

  return { org, loading }
}
