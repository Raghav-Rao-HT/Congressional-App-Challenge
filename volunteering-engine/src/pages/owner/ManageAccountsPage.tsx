import { FlaskConical, Search, ShieldCheck, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Field'
import { EmptyState, Page, PageHeader } from '../../components/ui/Page'
import { Skeleton } from '../../components/ui/Skeleton'
import { useAllUsers } from '../../hooks/useAllUsers'
import { makeAdmin, removeAdmin, setTestAccount } from '../../lib/firestore/users'
import { roleBadge } from '../../lib/roleBadge'
import { isSiteOwner } from '../../lib/roles'
import type { UserProfile } from '../../types/models'

function rank(user: UserProfile): number {
  if (isSiteOwner(user.uid)) return 0
  return user.accountType === 'admin' ? 1 : 2
}

export function ManageAccountsPage() {
  const { users, error: loadError } = useAllUsers()
  const [query, setQuery] = useState('')
  const [confirming, setConfirming] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const sorted = useMemo(
    () => [...(users ?? [])].sort((a, b) => rank(a) - rank(b) || a.email.localeCompare(b.email)),
    [users],
  )
  const needle = query.trim().toLowerCase()
  const shown = needle
    ? sorted.filter((user) => user.email.toLowerCase().includes(needle) || user.displayName.toLowerCase().includes(needle))
    : sorted
  const adminCount = sorted.filter((user) => user.accountType === 'admin').length

  async function run(user: UserProfile, action: () => Promise<void>, done: string) {
    setBusy(user.uid)
    setError(null)
    setNotice(null)
    try {
      await action()
      setConfirming(null)
      setNotice(done)
    } catch (err) {
      console.error(err)
      setError("Couldn't save that change.")
    } finally {
      setBusy(null)
    }
  }

  const toggleTest = (user: UserProfile) =>
    run(
      user,
      () => setTestAccount(user.uid, !user.isTestAccount),
      `${user.email} ${user.isTestAccount ? 'is no longer' : 'is now'} a test account.`,
    )

  const changeAdmin = (user: UserProfile, becomeAdmin: boolean) =>
    run(
      user,
      () => (becomeAdmin ? makeAdmin(user) : removeAdmin(user)),
      `${user.email} ${becomeAdmin ? 'is now' : 'is no longer'} an admin.`,
    )

  return (
    <Page width="narrow">
      <PageHeader
        title="Accounts"
        description="Everyone who has registered. Admins can do everything you can except choose other admins. Test accounts get everything they ask for approved automatically."
        back={{ to: '/admin', label: 'Admin' }}
      />

      <label className="relative block">
        <span className="sr-only">Search accounts by email or name</span>
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by email or name"
          autoComplete="off"
          className="pl-10"
        />
      </label>

      {users && (
        <p className="mt-3 text-sm text-muted">
          {users.length} registered, {adminCount} admin{adminCount === 1 ? '' : 's'}
        </p>
      )}

      {notice && (
        <p role="status" className="mt-4 rounded-xl bg-ok-soft px-4 py-3 text-sm font-medium text-ok">
          {notice}
        </p>
      )}
      {(error || loadError) && (
        <p role="alert" className="mt-4 rounded-xl bg-bad-soft px-4 py-3 text-sm font-medium text-bad">
          {error ?? loadError}
        </p>
      )}

      {users === null && !loadError ? (
        <div className="mt-5 space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : shown.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={Users} title="No accounts found" description="Try a different search." />
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {shown.map((user) => {
            const role = roleBadge(user)
            const owner = isSiteOwner(user.uid)
            const isAdmin = user.accountType === 'admin'
            const asking = confirming === user.uid
            return (
              <li key={user.uid}>
                <Card className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                    <span
                      aria-hidden
                      className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white"
                    >
                      {(user.displayName || user.email).trim().charAt(0).toUpperCase() || '?'}
                    </span>
                    <div className="min-w-0 flex-1 basis-56">
                      <p className="break-all font-semibold text-fg">{user.email}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-muted">
                        <span className="truncate">{user.displayName}</span>
                        <Badge tone={role.tone}>{role.label}</Badge>
                        {user.isTestAccount && (
                          <Badge tone="warn">
                            <FlaskConical className="size-3" aria-hidden />
                            Test account
                          </Badge>
                        )}
                      </p>
                    </div>
                    {!owner && !asking && (
                      <div className="flex flex-wrap gap-2">
                        {!isAdmin && (
                          <Button size="sm" variant="ghost" loading={busy === user.uid} onClick={() => toggleTest(user)}>
                            <FlaskConical className="size-4" aria-hidden />
                            {user.isTestAccount ? 'Remove test mark' : 'Make test account'}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant={isAdmin ? 'danger' : 'secondary'}
                          onClick={() => {
                            setNotice(null)
                            setConfirming(user.uid)
                          }}
                        >
                          {!isAdmin && <ShieldCheck className="size-4" aria-hidden />}
                          {isAdmin ? 'Remove admin' : 'Make admin'}
                        </Button>
                      </div>
                    )}
                  </div>

                  {asking && (
                    <div className="mt-4 rounded-2xl bg-surface-2 p-4">
                      <p className="text-sm text-fg">
                        {isAdmin
                          ? `Remove admin access from ${user.email}? They go back to being ${user.roleBeforeAdmin === 'organization_officer' ? 'an organization' : 'a volunteer'}.`
                          : `Make ${user.email} an admin? They'll be able to verify organizations, manage events and hide people from the leaderboard.`}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant={isAdmin ? 'danger' : 'primary'}
                          loading={busy === user.uid}
                          onClick={() => changeAdmin(user, !isAdmin)}
                        >
                          {isAdmin ? 'Yes, remove admin' : 'Yes, make admin'}
                        </Button>
                        <Button size="sm" variant="ghost" disabled={busy === user.uid} onClick={() => setConfirming(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </Page>
  )
}
