import { Megaphone } from 'lucide-react'
import { useEffect, useState } from 'react'
import { AdminEventCard } from '../../components/bulletin/AdminEventCard'
import { EmptyState, Page, PageHeader } from '../../components/ui/Page'
import { Tabs } from '../../components/ui/Tabs'
import { deleteBulletinPost, subscribeAllBulletinPosts } from '../../lib/firestore/bulletinPosts'
import type { BulletinPost } from '../../types/models'

type Tab = 'upcoming' | 'past'

const TABS: { value: Tab; label: string }[] = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
]

export function AdminEventsPage() {
  const [tab, setTab] = useState<Tab>('upcoming')
  const [posts, setPosts] = useState<BulletinPost[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [now] = useState(() => Date.now())

  useEffect(
    () =>
      subscribeAllBulletinPosts(setPosts, (err) => {
        console.error('Could not load events:', err)
        setLoadError(
          (err as { code?: string }).code === 'permission-denied'
            ? 'Firestore refused to list events. Either the latest security rules are not deployed yet, or this account does not have the admin permission (sign out and back in after it is granted).'
            : 'Could not load events. Check your connection and try again.',
        )
      }),
    [],
  )

  async function handleDelete(postId: string) {
    setBusyId(postId)
    setDeleteError(null)
    try {
      await deleteBulletinPost(postId)
      setConfirmingId(null)
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Could not delete the event. Try again.')
    } finally {
      setBusyId(null)
    }
  }

  const shown = (posts ?? [])
    .filter((post) => (tab === 'upcoming') === (post.endAt >= now))
    .sort((a, b) => (tab === 'upcoming' ? a.startAt - b.startAt : b.startAt - a.startAt))

  return (
    <Page width="narrow">
      <PageHeader
        title="Manage events"
        description="Every event on the bulletin board, including members-only ones. Deleting an event also removes its RSVPs."
        back={{ to: '/admin', label: 'Admin' }}
      />

      <Tabs
        tabs={TABS}
        value={tab}
        onChange={(next) => {
          setTab(next)
          setConfirmingId(null)
          setDeleteError(null)
        }}
      />

      {(loadError || deleteError) && (
        <p role="alert" className="mt-6 rounded-xl bg-bad-soft px-4 py-3 text-sm font-medium text-bad">
          {loadError ?? deleteError}
        </p>
      )}

      {loadError ? null : posts === null ? (
        <p className="mt-6 text-sm text-muted">Loading events…</p>
      ) : shown.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={Megaphone} title={tab === 'upcoming' ? 'No upcoming events' : 'No past events'} />
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {shown.map((post) => (
            <li key={post.postId}>
              <AdminEventCard
                post={post}
                confirming={confirmingId === post.postId}
                busy={busyId === post.postId}
                onAskDelete={() => {
                  setDeleteError(null)
                  setConfirmingId(post.postId)
                }}
                onCancel={() => setConfirmingId(null)}
                onConfirm={() => handleDelete(post.postId)}
              />
            </li>
          ))}
        </ul>
      )}
    </Page>
  )
}
