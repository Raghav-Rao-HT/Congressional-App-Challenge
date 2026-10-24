import { signOut } from 'firebase/auth'
import {
  LayoutDashboard,
  LogOut,
  Map as MapIcon,
  Megaphone,
  Menu,
  ShieldCheck,
  Trophy,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthProvider'
import { cn } from '../../lib/cn'
import { auth } from '../../lib/firebase'
import { homePathFor } from '../../lib/roles'
import type { AccountType } from '../../types/models'

const HOME_LABEL: Record<AccountType, string> = {
  member: 'Dashboard',
  organization_officer: 'My organization',
  admin: 'Admin',
}

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

function linkClasses({ isActive }: { isActive: boolean }) {
  return cn(
    'flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition',
    isActive ? 'bg-info-soft text-info' : 'text-muted hover:bg-surface-2 hover:text-fg',
  )
}

export function NavBar() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleLogout() {
    setMenuOpen(false)
    await signOut(auth)
    navigate('/login')
  }

  const items: NavItem[] = profile
    ? [
        { to: homePathFor(profile.accountType), label: HOME_LABEL[profile.accountType], icon: LayoutDashboard, end: true },
        { to: '/bulletin', label: 'Bulletin', icon: Megaphone },
        { to: '/map', label: 'Map', icon: MapIcon },
        { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
        ...(profile.accountType === 'admin'
          ? [{ to: '/admin/orgs', label: 'Verify organizations', icon: ShieldCheck }]
          : []),
      ]
    : []

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link
          to={profile ? homePathFor(profile.accountType) : '/'}
          className="flex items-center gap-2.5 font-bold tracking-tight text-fg"
          aria-label="VetWork"
        >
          <img src="/logo.png" alt="" className="size-9" />
          <span className="hidden sm:inline">VetWork</span>
        </Link>

        {profile && (
          <>
            <nav aria-label="Main" className="ml-4 hidden items-center gap-1 md:flex">
              {items.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end} className={linkClasses}>
                  <item.icon className="size-4" aria-hidden />
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="ml-auto flex items-center gap-2">
              <span className="hidden items-center gap-2 rounded-full bg-surface-2 py-1 pl-1 pr-3 text-sm font-medium text-fg sm:flex">
                <span
                  aria-hidden
                  className="grid size-7 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold text-white"
                >
                  {profile.displayName.trim().charAt(0).toUpperCase() || '?'}
                </span>
                <span className="max-w-32 truncate">{profile.displayName}</span>
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="hidden items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted transition hover:bg-surface-2 hover:text-fg md:flex"
              >
                <LogOut className="size-4" aria-hidden />
                Log out
              </button>
              <button
                type="button"
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
                className="grid size-10 place-items-center rounded-xl text-fg transition hover:bg-surface-2 md:hidden"
              >
                {menuOpen ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
              </button>
            </div>
          </>
        )}
      </div>

      {profile && menuOpen && (
        <nav aria-label="Mobile" className="border-t border-line bg-surface px-4 py-3 md:hidden">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-muted">{profile.displayName}</p>
          <div className="flex flex-col gap-1">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={linkClasses}
                onClick={() => setMenuOpen(false)}
              >
                <item.icon className="size-4" aria-hidden />
                {item.label}
              </NavLink>
            ))}
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-muted transition hover:bg-surface-2 hover:text-fg"
            >
              <LogOut className="size-4" aria-hidden />
              Log out
            </button>
          </div>
        </nav>
      )}
    </header>
  )
}
