import { Search, Trophy, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { EmptyState, Page, PageHeader } from '../components/ui/Page'
import { Field, Input } from '../components/ui/Field'
import { RankRow } from '../components/ui/RankRow'
import { Tabs } from '../components/ui/Tabs'
import { useAuth } from '../context/AuthProvider'
import { useFriendsRanking } from '../hooks/useFriendsRanking'
import { subscribeTopMembers } from '../lib/firestore/leaderboard'
import type { UserProfile } from '../types/models'

type Tab = 'statewide' | 'friends'

export function LeaderboardPage() {
  const { user, profile } = useAuth()
  const [tab, setTab] = useState<Tab>('statewide')
  const [stateFilter, setStateFilter] = useState(profile?.homeState ?? '')
  const [members, setMembers] = useState<UserProfile[]>([])
  const { ranked: friendsRanked } = useFriendsRanking(user?.uid)

  useEffect(() => subscribeTopMembers(setMembers, { state: stateFilter || undefined }), [stateFilter])

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

          {members.length > 0 ? (
            <ol className="mt-6 space-y-2">
              {members.map((m, i) => (
                <RankRow
                  key={m.uid}
                  rank={i + 1}
                  name={m.displayName}
                  meta={m.homeState}
                  value={`${m.totalPoints} pts`}
                  highlight={m.uid === user?.uid}
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
