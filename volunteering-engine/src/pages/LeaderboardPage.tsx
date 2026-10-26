import { Search, Trophy, Undo2, UserMinus, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { EmptyState, Page, PageHeader } from '../components/ui/Page'
import { Field, Input } from '../components/ui/Field'
import { RankRow } from '../components/ui/RankRow'
import { Tabs } from '../components/ui/Tabs'
import { useAuth } from '../context/AuthProvider'
import { useFriendsRanking } from '../hooks/useFriendsRanking'
import { subscribeTopMembers } from '../lib/firestore/leaderboard'
import { setLeaderboardHidden } from '../lib/firestore/users'
import type { UserProfile } from '../types/models'

type Tab = 'statewide' | 'friends'

export function LeaderboardPage() {
  const { user, profile } = useAuth()
  const isAdmin = profile?.accountType === 'admin'
  const [tab, setTab] = useState<Tab>('statewide')
  const [stateFilter, setStateFilter] = useState(profile?.homeState ?? '')
  const [members, setMembers] = useState<UserProfile[]>([])
  const [confirmingUid, setConfirmingUid] = useState<string | null>(null)
  const [busyUid, setBusyUid] = useState<string | null>(null)
  const [adminError, setAdminError] = useState<string | null>(null)
  const { ranked: friendsRanked } = useFriendsRanking(user?.uid)

  useEffect(
    () => subscribeTopMembers(setMembers, { state: stateFilter || undefined, includeHidden: isAdmin }),
    [stateFilter, isAdmin],
  )

  let nextRank = 1
  const rows = members.map((member) => ({ member, rank: member.leaderboardHidden ? null : nextRank++ }))

  async function setHidden(uid: string, hidden: boolean) {
    setBusyUid(uid)
    setAdminError(null)
    try {
      await setLeaderboardHidden(uid, hidden)
      setConfirmingUid(null)
    } catch (err) {
      console.error('Could not update the leaderboard:', err)
      setAdminError(
        (err as { code?: string }).code === 'permission-denied'
          ? 'Firestore refused this change. The latest security rules must be deployed, and this account needs the admin permission.'
          : 'Could not update the leaderboard. Try again.',
      )
    } finally {
      setBusyUid(null)
    }
  }

  return (
    <Page width="narrow">
      <PageHeader title="Leaderboard" description="See who's giving the most back." />

      <Tabs
        tabs={[
          { value: 'statewide', label: 'Statewide' },
          { value: 'friends', label: 'Friends' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'statewide' && (
        <>
          <div className="relative mt-6 max-w-xs">
            <Field label="State">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
                <Input
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value.toUpperCase())}
                  maxLength={2}
                  placeholder="e.g. NJ (blank = all)"
                  className="pl-10"
                />
              </div>
            </Field>
          </div>

          {isAdmin && (
            <p className="mt-4 text-sm text-muted">
              Admin: use Remove to take a member off the leaderboard. Removed members are dimmed here and can be restored.
            </p>
          )}
          {adminError && (
            <p role="alert" className="mt-4 rounded-xl bg-bad-soft px-4 py-3 text-sm font-medium text-bad">
              {adminError}
            </p>
          )}

          {rows.length > 0 ? (
            <ol className="mt-6 space-y-2">
              {rows.map(({ member: m, rank }) => (
                <RankRow
                  key={m.uid}
                  rank={rank}
                  name={m.displayName}
                  meta={
                    <>
                      {m.homeState}
                      {m.leaderboardHidden && (
                        <Badge tone="warn" className="ml-2">
                          Removed
                        </Badge>
                      )}
                    </>
                  }
                  value={`${m.totalPoints} pts`}
                  highlight={m.uid === user?.uid}
                  muted={m.leaderboardHidden}
                  action={
                    isAdmin &&
                    (m.leaderboardHidden ? (
                      <Button size="sm" variant="secondary" loading={busyUid === m.uid} onClick={() => setHidden(m.uid, false)}>
                        <Undo2 className="size-4" aria-hidden />
                        Restore
                      </Button>
                    ) : (
                      <Button size="sm" variant="danger" onClick={() => setConfirmingUid(m.uid)}>
                        <UserMinus className="size-4" aria-hidden />
                        Remove
                      </Button>
                    ))
                  }
                  footer={
                    isAdmin &&
                    confirmingUid === m.uid && (
                      <div role="group" aria-label={`Confirm removing ${m.displayName}`} className="space-y-3">
                        <p className="text-sm font-medium text-bad">
                          Remove {m.displayName} from the leaderboard? Their account, points and hours are kept, and you can restore them any time.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="secondary" disabled={busyUid === m.uid} onClick={() => setConfirmingUid(null)}>
                            Cancel
                          </Button>
                          <Button size="sm" variant="danger" loading={busyUid === m.uid} onClick={() => setHidden(m.uid, true)}>
                            <UserMinus className="size-4" aria-hidden />
                            Remove from leaderboard
                          </Button>
                        </div>
                      </div>
                    )
                  }
                />
              ))}
            </ol>
          ) : (
            <div className="mt-6">
              <EmptyState icon={Trophy} title="No volunteers ranked yet" description="Get hours approved to appear here." />
            </div>
          )}
        </>
      )}

      {tab === 'friends' &&
        (friendsRanked.length > 0 ? (
          <ol className="mt-6 space-y-2">
            {friendsRanked.map((f, i) => (
              <RankRow key={f.uid} rank={i + 1} name={f.displayName} value={`${f.totalPoints} pts`} />
            ))}
          </ol>
        ) : (
          <div className="mt-6">
            <EmptyState icon={Users} title="No friends yet" description="Add friends to compare points." />
          </div>
        ))}
    </Page>
  )
}
