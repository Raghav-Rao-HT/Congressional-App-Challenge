import { Navigate, Outlet } from 'react-router-dom'
import { VerifyEmailBanner, VerifyEmailGate } from '../components/auth/VerifyEmail'
import { useAuth } from '../context/AuthProvider'
import { REQUIRE_VERIFIED_EMAIL } from '../lib/featureFlags'

export function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) return null
  if (!user) return <Navigate to="/login" replace />

  if (!user.emailVerified) {
    if (REQUIRE_VERIFIED_EMAIL) return <VerifyEmailGate />
    return (
      <>
        <VerifyEmailBanner />
        <Outlet />
      </>
    )
  }

  return <Outlet />
}
