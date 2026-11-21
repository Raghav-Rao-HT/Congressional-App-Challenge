import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthProvider'
import { subscribeBulletinPosts } from '../lib/firestore/bulletinPosts'
import type { BulletinPost } from '../types/models'
import { useOrgApplications } from './useOrgApplications'

export function useBulletinPosts(filterState: string): BulletinPost[] {
  const { profile } = useAuth()
  const { applications } = useOrgApplications()
  const [posts, setPosts] = useState<BulletinPost[]>([])
  const profileOrgId = profile?.orgId ?? null

  const orgKey = useMemo(() => {
    const ids = new Set<string>()
    Object.entries(applications).forEach(([orgId, status]) => {
      if (status === 'approved') ids.add(orgId)
    })
    if (profileOrgId) ids.add(profileOrgId)
    return [...ids].sort().join(',')
  }, [applications, profileOrgId])

  useEffect(
    () => subscribeBulletinPosts(orgKey ? orgKey.split(',') : [], setPosts, filterState || undefined),
    [orgKey, filterState],
  )

  return posts
}
