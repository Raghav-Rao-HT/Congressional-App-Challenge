import { CalendarDays, Lock, Megaphone, MapPin, Plus, Search, Users } from 'lucide-react'
import { useState } from 'react'
import { ManageRsvps } from '../../components/bulletin/ManageRsvps'
import { RsvpControl } from '../../components/bulletin/RsvpControl'
import { Badge } from '../../components/ui/Badge'
import { ButtonLink } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Field'
import { EmptyState, Page, PageHeader } from '../../components/ui/Page'
import { useAuth } from '../../context/AuthProvider'
import { useBulletinPosts } from '../../hooks/useBulletinPosts'

const monthFormat = new Intl.DateTimeFormat(undefined, { month: 'short' })

function DateBadge({ at }: { at: number }) {
  const date = new Date(at)
  return (
    <div
      aria-hidden
      className="grid size-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-center text-white shadow-sm"
    >
      <div>
        <div className="text-[0.7rem] font-semibold uppercase leading-none tracking-wider text-white/80">
          {monthFormat.format(date)}
        </div>
        <div className="mt-0.5 text-2xl font-bold leading-none tabular-nums">{date.getDate()}</div>
      </div>
    </div>
  )
}

export function BulletinBoardPage() {
  const { user, profile } = useAuth()
  const [stateFilter, setStateFilter] = useState('')
  const posts = useBulletinPosts(stateFilter)

  return (
    <Page width="narrow">
      <PageHeader
        title="Bulletin board"
        description="Volunteer opportunities and events. RSVP and the organizer will confirm your spot."
        actions={
          <ButtonLink to="/bulletin/new">
            <Plus className="size-4" aria-hidden />
            Post an opportunity
          </ButtonLink>
        }
      />

      <label className="relative block max-w-xs">
        <span className="sr-only">Filter by state</span>
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
        <Input
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value.toUpperCase())}
          placeholder="Filter by state, e.g. NJ"
          maxLength={2}
          className="pl-10"
        />
      </label>

      {posts.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Megaphone}
            title="No upcoming opportunities yet"
            description="Be the first to post one, or check back soon."
          />
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {posts.map((post) => {
            const isPoster = user?.uid === post.authorUid
            return (
              <li key={post.postId}>
                <Card interactive className="p-5 sm:p-6">
                  <div className="flex gap-4">
                    <DateBadge at={post.startAt} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-bold tracking-tight text-fg">{post.title}</h2>
                        {post.audience === 'members' && (
                          <Badge tone="violet">
                            <Lock className="size-3" aria-hidden />
                            Members only
                          </Badge>
                        )}
                        <Badge tone={post.authorType === 'org' ? 'brand' : 'neutral'}>
                          {post.authorType === 'org' ? 'Organization' : 'Volunteer'}
                        </Badge>
                      </div>
                      <p className="mt-1.5 text-pretty text-muted">{post.description}</p>

                      <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted">
                        <div className="flex items-center gap-1.5">
                          <CalendarDays className="size-4" aria-hidden />
                          <dt className="sr-only">When</dt>
                          <dd>
                            {new Date(post.startAt).toLocaleDateString()} – {new Date(post.endAt).toLocaleDateString()}
                          </dd>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="size-4" aria-hidden />
                          <dt className="sr-only">Where</dt>
                          <dd>
                            {post.location.city}, {post.location.state}
                          </dd>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="size-4" aria-hidden />
                          <dt className="sr-only">Going</dt>
                          <dd>{post.approvedCount ?? 0} going</dd>
                        </div>
                      </dl>

                      {post.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {post.tags.map((tag) => (
                            <Badge key={tag}>{tag}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {user && profile && (
                    <div className="mt-5 border-t border-line pt-4">
                      {isPoster ? (
                        <ManageRsvps postId={post.postId} />
                      ) : (
                        <RsvpControl postId={post.postId} uid={user.uid} displayName={profile.displayName} />
                      )}
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
