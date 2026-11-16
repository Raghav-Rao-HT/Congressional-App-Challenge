import { Check, Search, UserPlus, Users, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { CodeBadge } from '../../components/ui/CodeBadge'
import { Input } from '../../components/ui/Field'
import { EmptyState, Page, PageHeader, Section } from '../../components/ui/Page'
import { RankRow } from '../../components/ui/RankRow'
import { useAuth } from '../../context/AuthProvider'
import { otherUid, useFriendsRanking } from '../../hooks/useFriendsRanking'
import { useMyContact } from '../../hooks/useMyContact'
import { normalizeCode } from '../../lib/codes'
import { lookupFriendCode, respondToFriendRequest, sendFriendRequest } from '../../lib/firestore/friendships'

type Found = { uid: string; displayName: string }

export function FriendsPage() {
  const { user } = useAuth()
  const { friendships, profiles, ranked } = useFriendsRanking(user?.uid)
  const { contact, error: contactError } = useMyContact()
  const [codeInput, setCodeInput] = useState('')
  const [found, setFound] = useState<Found | null>(null)
  const [message, setMessage] = useState<{ tone: 'ok' | 'bad'; text: string } | null>(null)
  const [busy, setBusy] = useState<'lookup' | 'send' | null>(null)

  async function handleLookup() {
    if (!user) return
    setFound(null)
    setMessage(null)
    if (!normalizeCode(codeInput)) {
      setMessage({ tone: 'bad', text: 'A friend code is 8 letters and numbers, like K7QM-4XPD.' })
      return
    }
    setBusy('lookup')
    try {
      const result = await lookupFriendCode(codeInput)
      if (!result) setMessage({ tone: 'bad', text: "We couldn't find anyone with that code. Check it and try again." })
      else if (result.uid === user.uid) setMessage({ tone: 'bad', text: "That's your own code. Share it with a friend instead!" })
      else setFound(result)
    } catch {
      setMessage({ tone: 'bad', text: "We couldn't look that up just now. Please try again." })
    } finally {
      setBusy(null)
    }
  }

  async function handleSendRequest() {
    if (!user || !found) return
    setBusy('send')
    try {
      await sendFriendRequest(user.uid, found.uid)
      setMessage({ tone: 'ok', text: `Friend request sent to ${found.displayName}.` })
      setFound(null)
      setCodeInput('')
    } catch {
      setMessage({ tone: 'bad', text: 'You may already have a request with this person.' })
    } finally {
      setBusy(null)
    }
  }

  if (!user) return null

  const incoming = friendships.filter((f) => f.status === 'pending' && f.recipientUid === user.uid)
  const outgoing = friendships.filter((f) => f.status === 'pending' && f.requesterUid === user.uid)
  const accepted = friendships.filter((f) => f.status === 'accepted')
  const alreadyKnown = found ? friendships.some((f) => otherUid(f, user.uid) === found.uid) : false

  return (
    <Page width="narrow">
      <PageHeader title="Friends" description="Add friends and see how you stack up." />

      <Card className="space-y-5 p-5">
        <div>
          <h2 className="text-sm font-medium text-fg">Your friend code</h2>
          <p className="mt-1 text-xs text-muted">
            Give this to people you know. Nobody can search for you by name, so only people you share it with can send you a request.
          </p>
          <div className="mt-3">
            {contact ? (
              <CodeBadge code={contact.friendCode} label="Your friend code" />
            ) : contactError ? (
              <p className="text-sm text-bad">We couldn&apos;t load your code. Refresh the page to try again.</p>
            ) : (
              <p className="text-sm text-muted">Getting your code...</p>
            )}
          </div>
        </div>

        <div className="border-t border-line pt-5">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-fg">Add a friend with their code</span>
            <span className="flex gap-2">
              <Input
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                placeholder="K7QM-4XPD"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                className="font-mono uppercase tracking-widest"
              />
              <Button variant="secondary" loading={busy === 'lookup'} onClick={handleLookup}>
                <Search className="size-4" aria-hidden />
                Find
              </Button>
            </span>
          </label>

          {message && (
            <p
              role="status"
              className={message.tone === 'ok' ? 'mt-3 text-sm font-medium text-ok' : 'mt-3 text-sm font-medium text-bad'}
            >
              {message.text}
            </p>
          )}

          {found && (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-surface-2 px-4 py-2.5">
              <span className="truncate text-sm font-medium text-fg">{found.displayName}</span>
              {alreadyKnown ? (
                <span className="text-xs text-muted">Already connected or pending</span>
              ) : (
                <Button size="sm" loading={busy === 'send'} onClick={handleSendRequest}>
                  <UserPlus className="size-4" aria-hidden />
                  Add friend
                </Button>
              )}
            </div>
          )}
        </div>
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
          <EmptyState icon={Users} title="No friends yet" description="Share your friend code, or enter a friend's code above." />
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
