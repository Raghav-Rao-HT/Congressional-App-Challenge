import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthProvider'

export function RequireSiteOwner() {
  const { isSiteOwner, profile, loading } = useAuth()

  if (loading) return null
  if (!isSiteOwner || profile?.accountType !== 'admin') return <Navigate to="/" replace />

  return <Outlet />
}
