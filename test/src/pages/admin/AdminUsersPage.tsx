import { Building2, HandHeart, Search, ShieldCheck, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Field'
import { EmptyState, Page, PageHeader } from '../../components/ui/Page'
import { Skeleton } from '../../components/ui/Skeleton'
import { StatTile } from '../../components/ui/StatTile'
import { Tabs } from '../../components/ui/Tabs'
import { useAllUsers } from '../../hooks/useAllUsers'
import { roleBadge } from '../../lib/roleBadge'
import type { AccountType } from '../../types/models'

type RoleFilter = 'all' | AccountType

export function AdminUsersPage() {
  const { users, error } = useAllUsers()
  const [query, setQuery] = useState('')
  const [role, setRole] = useState<RoleFilter>('all')

  const sorted = useMemo(() => [...(users ?? [])].sort((a, b) => a.displayName.localeCompare(b.displayName)), [users])
  const count = (type: AccountType) => sorted.filter((user) => user.accountType === type).length

  const needle = query.trim().toLowerCase()
  const shown = sorted.filter(
    (user) =>
      (role === 'all' || user.accountType === role) &&
      (!needle || user.displayName.toLowerCase().includes(needle) || user.email.toLowerCase().includes(needle)),
  )

  return (
    <Page width="wide">
      <PageHeader title="Users" description="Everyone who has signed up for VetWork." back={{ to: '/admin', label: 'Admin' }} />

      {error && (
        <p role="alert" className="mb-5 rounded-xl bg-bad-soft px-4 py-3 text-sm font-medium text-bad">
          {error}
        </p>
      )}

      {users === null && !error ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : (
        users && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatTile icon={Users} label="Total users" value={users.length} />
              <StatTile icon={HandHeart} label="Volunteers" value={count('member')} tone="ok" />
              <StatTile icon={Building2} label="Organizations" value={count('organization_officer')} tone="warn" />
              <StatTile icon={ShieldCheck} label="Admins" value={count('admin')} tone="violet" />
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <label className="relative block w-full max-w-xs">
                <span className="sr-only">Search users by name or email</span>
                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by name or email"
                  autoComplete="off"
                  className="pl-10"
                />
              </label>
              <Tabs
                tabs={[
                  { value: 'all', label: `All (${users.length})` },
                  { value: 'member', label: `Volunteers (${count('member')})` },
                  { value: 'organization_officer', label: `Organizations (${count('organization_officer')})` },
                  { value: 'admin', label: `Admins (${count('admin')})` },
                ]}
                value={role}
                onChange={setRole}
              />
            </div>

            {shown.length === 0 ? (
              <div className="mt-6">
                <EmptyState icon={Users} title="No users found" description="Try a different search or filter." />
              </div>
            ) : (
              <Card className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[44rem] text-left text-sm">
                  <thead>
                    <tr className="border-b border-line text-xs font-semibold uppercase tracking-wide text-muted">
                      <th scope="col" className="px-5 py-3">Name</th>
                      <th scope="col" className="px-3 py-3">Role</th>
                      <th scope="col" className="px-3 py-3">State</th>
                      <th scope="col" className="px-3 py-3 text-right">Hours</th>
                      <th scope="col" className="px-3 py-3 text-right">Points</th>
                      <th scope="col" className="px-3 py-3 text-right">Streak</th>
                      <th scope="col" className="px-5 py-3">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {shown.map((user) => {
                      const badge = roleBadge(user)
                      const volunteer = user.accountType === 'member'
                      return (
                        <tr key={user.uid}>
                          <td className="px-5 py-3">
                            <p className="font-semibold text-fg">{user.displayName}</p>
                            <p className="break-all text-muted">{user.email}</p>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex flex-wrap gap-1.5">
                              <Badge tone={badge.tone}>{badge.label}</Badge>
                              {user.isTestAccount && <Badge tone="warn">Test</Badge>}
                              {user.leaderboardHidden && <Badge>Hidden</Badge>}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-muted">{user.homeState}</td>
                          <td className="px-3 py-3 text-right tabular-nums">{volunteer ? user.totalHoursApproved : '-'}</td>
                          <td className="px-3 py-3 text-right tabular-nums">{volunteer ? user.totalPoints : '-'}</td>
                          <td className="px-3 py-3 text-right tabular-nums">{volunteer ? `${user.currentStreakWeeks} wk` : '-'}</td>
                          <td className="px-5 py-3 text-muted">{new Date(user.createdAt).toLocaleDateString()}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </Card>
            )}
          </>
        )
      )}
    </Page>
  )
}
