import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthProvider'

export function RequireSiteOwner() {
  const { isSiteOwner, loading } = useAuth()

  if (loading) return null
  if (!isSiteOwner) return <Navigate to="/" replace />

  return <Outlet />
}
