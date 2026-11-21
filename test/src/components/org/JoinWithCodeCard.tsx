import { CircleCheck, KeyRound } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../context/AuthProvider'
import { JoinCodeError, joinWithCode } from '../../lib/firestore/joinCodes'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Input } from '../ui/Field'

/** "My organization gave me a code": join their roster immediately instead of applying and waiting. */
export function JoinWithCodeCard({ onJoined }: { onJoined?: (orgId: string) => void }) {
  const { user, profile } = useAuth()
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ tone: 'ok' | 'bad'; text: string } | null>(null)

  async function submit() {
    if (!user || !profile) return
    setBusy(true)
    setMessage(null)
    try {
      const result = await joinWithCode({ code, uid: user.uid, displayName: profile.displayName })
      setMessage({
        tone: 'ok',
        text: result.alreadyMember ? "You're already a member of that organization." : "You're in! You can now log hours with them.",
      })
      setCode('')
      onJoined?.(result.orgId)
    } catch (err) {
      setMessage({
        tone: 'bad',
        text: err instanceof JoinCodeError ? err.message : "We couldn't use that code. Check it and try again.",
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="p-5">
      <label className="block">
        <span className="mb-1.5 flex items-center gap-2 text-sm font-medium text-fg">
          <KeyRound className="size-4 text-info" aria-hidden />
          Have a join code from your organization?
        </span>
        <span className="flex gap-2">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                submit()
              }
            }}
            placeholder="K7QM-4XPD"
            autoComplete="off"
            spellCheck={false}
            className="font-mono uppercase tracking-widest"
          />
          <Button loading={busy} onClick={submit}>
            Join
          </Button>
        </span>
      </label>
      {message && (
        <p
          role="status"
          className={`mt-3 flex items-center gap-2 text-sm font-medium ${message.tone === 'ok' ? 'text-ok' : 'text-bad'}`}
        >
          {message.tone === 'ok' && <CircleCheck className="size-4" aria-hidden />}
          {message.text}
        </p>
      )}
    </Card>
  )
}
