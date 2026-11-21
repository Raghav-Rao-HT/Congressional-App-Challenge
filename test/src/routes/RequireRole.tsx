import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthProvider'
import { homePathFor } from '../lib/roles'
import type { AccountType } from '../types/models'

export function RequireRole({ accountType }: { accountType: AccountType }) {
  const { profile, loading } = useAuth()

  if (loading) return null
  if (!profile) return <Navigate to="/login" replace />
  if (profile.accountType !== accountType) {
    return <Navigate to={homePathFor(profile.accountType)} replace />
  }

  return <Outlet />
}
