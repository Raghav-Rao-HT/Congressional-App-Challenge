import { Check, Search, UserPlus, Users, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Field'
import { EmptyState, Page, PageHeader, Section } from '../../components/ui/Page'
import { RankRow } from '../../components/ui/RankRow'
import { useAuth } from '../../context/AuthProvider'
import { otherUid, useFriendsRanking } from '../../hooks/useFriendsRanking'
import {
  respondToFriendRequest,
  searchMembersByName,
  sendFriendRequest,
} from '../../lib/firestore/friendships'

export function FriendsPage() {
  const { user } = useAuth()
  const { friendships, profiles, ranked } = useFriendsRanking(user?.uid)
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<{ uid: string; displayName: string }[]>([])
  const [requesting, setRequesting] = useState<string | null>(null)

  async function handleSearch(value: string) {
    setSearch(value)
    setResults(value.trim() ? await searchMembersByName(value) : [])
  }

  async function handleSendRequest(toUid: string) {
    if (!user) return
    setRequesting(toUid)
    try {
      await sendFriendRequest(user.uid, toUid)
    } finally {
      setRequesting(null)
    }
  }

  if (!user) return null

  const incoming = friendships.filter((f) => f.status === 'pending' && f.recipientUid === user.uid)
  const outgoing = friendships.filter((f) => f.status === 'pending' && f.requesterUid === user.uid)
  const accepted = friendships.filter((f) => f.status === 'accepted')
  const knownUids = new Set(friendships.map((f) => otherUid(f, user.uid)))
  const visibleResults = results.filter((r) => r.uid !== user.uid && !knownUids.has(r.uid))

  return (
    <Page width="narrow">
      <PageHeader title="Friends" description="Add friends and see how you stack up." />

      <Card className="p-5">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-fg">Find members</span>
          <span className="relative block">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <Input
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by name…"
              className="pl-10"
            />
          </span>
        </label>
        {visibleResults.length > 0 && (
          <ul className="mt-3 space-y-2">
            {visibleResults.map((r) => (
              <li
                key={r.uid}
                className="flex items-center justify-between gap-3 rounded-xl bg-surface-2 px-4 py-2.5"
              >
                <span className="truncate text-sm font-medium text-fg">{r.displayName}</span>
                <Button size="sm" loading={requesting === r.uid} onClick={() => handleSendRequest(r.uid)}>
                  <UserPlus className="size-4" aria-hidden />
                  Add friend
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {incoming.length > 0 && (
        <Section title="Friend requests">
          <ul className="space-y-2">
            {incoming.map((f) => {
              const uid = otherUid(f, user.uid)
              return (
                <li key={uid}>
                  <Card className="flex items-center justify-between gap-3 px-4 py-3">
                    <span className="truncate font-medium text-fg">{profiles[uid]?.displayName ?? uid}</span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() =>
                          respondToFriendRequest({ fromUid: uid, toUid: user.uid, accept: true })
                        }
                      >
                        <Check className="size-4" aria-hidden />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          respondToFriendRequest({ fromUid: uid, toUid: user.uid, accept: false })
                        }
                      >
                        <X className="size-4" aria-hidden />
                        Decline
                      </Button>
                    </div>
                  </Card>
                </li>
              )
            })}
          </ul>
        </Section>
      )}

      <Section title="Friends ranking">
        {accepted.length === 0 ? (
          <EmptyState icon={Users} title="No friends yet" description="Search above to add some." />
        ) : (
          <ol className="space-y-2">
            {ranked.map((f, i) => (
              <RankRow
                key={f.uid}
                rank={i + 1}
                name={f.displayName}
                meta={`${f.totalHoursApproved}h approved`}
                value={`${f.totalPoints} pts`}
              />
            ))}
          </ol>
        )}
        {outgoing.length > 0 && (
          <p className="mt-3 text-xs text-muted">{outgoing.length} request(s) awaiting response.</p>
        )}
      </Section>
    </Page>
  )
}
