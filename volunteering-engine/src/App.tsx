import { Navigate, Route, Routes } from 'react-router-dom'
import { NavBar } from './components/layout/NavBar'
import { useAuth } from './context/AuthProvider'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { AdminOrgDetailPage } from './pages/admin/AdminOrgDetailPage'
import { AdminOrgQueuePage } from './pages/admin/AdminOrgQueuePage'
import { LoginPage } from './pages/auth/LoginPage'
import { SignupPage } from './pages/auth/SignupPage'
import { BulletinBoardPage } from './pages/bulletin/BulletinBoardPage'
import { NewEventPage } from './pages/bulletin/NewEventPage'
import { LeaderboardPage } from './pages/LeaderboardPage'
import { NewJerseyMapPage } from './pages/map/NewJerseyMapPage'
import { FriendsPage } from './pages/member/FriendsPage'
import { GoalsPage } from './pages/member/GoalsPage'
import { IslandPage } from './pages/member/IslandPage'
import { LogHoursPage } from './pages/member/LogHoursPage'
import { MemberDashboardPage } from './pages/member/MemberDashboardPage'
import { PetsPage } from './pages/member/PetsPage'
import { OrgApprovalsPage } from './pages/org/OrgApprovalsPage'
import { OrgDashboardPage } from './pages/org/OrgDashboardPage'
import { OrgMembersPage } from './pages/org/OrgMembersPage'
import { OrgOnboardingPage } from './pages/org/OrgOnboardingPage'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { RequireRole } from './routes/RequireRole'
import { homePathFor } from './lib/roles'

function HomeRedirect() {
  const { user, profile, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (!profile) return null
  return <Navigate to={homePathFor(profile.accountType)} replace />
}

export default function App() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/bulletin" element={<BulletinBoardPage />} />
          <Route path="/bulletin/new" element={<NewEventPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/map" element={<NewJerseyMapPage />} />

          <Route element={<RequireRole accountType="member" />}>
            <Route path="/member" element={<MemberDashboardPage />} />
            <Route path="/member/log-hours" element={<LogHoursPage />} />
            <Route path="/member/pets" element={<PetsPage />} />
            <Route path="/member/island" element={<IslandPage />} />
            <Route path="/member/goals" element={<GoalsPage />} />
            <Route path="/member/friends" element={<FriendsPage />} />
          </Route>

          <Route element={<RequireRole accountType="organization_officer" />}>
            <Route path="/org" element={<OrgDashboardPage />} />
            <Route path="/org/onboarding" element={<OrgOnboardingPage />} />
            <Route path="/org/members" element={<OrgMembersPage />} />
            <Route path="/org/approvals" element={<OrgApprovalsPage />} />
          </Route>

          <Route element={<RequireRole accountType="admin" />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/orgs" element={<AdminOrgQueuePage />} />
            <Route path="/admin/orgs/:orgId" element={<AdminOrgDetailPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
