import { sendEmailVerification, signOut } from 'firebase/auth'
import { MailCheck } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../context/AuthProvider'
import { auth } from '../../lib/firebase'
import { Button } from '../ui/Button'
import { AuthLayout } from '../layout/AuthLayout'

type Status = { tone: 'ok' | 'bad'; text: string } | null

function useVerifyActions() {
  const { user } = useAuth()
  const [busy, setBusy] = useState<'resend' | 'check' | null>(null)
  const [status, setStatus] = useState<Status>(null)

  async function resend() {
    if (!user) return
    setBusy('resend')
    setStatus(null)
    try {
      await sendEmailVerification(user)
      setStatus({ tone: 'ok', text: `Verification email sent to ${user.email}. Check your spam folder too.` })
    } catch {
      setStatus({ tone: 'bad', text: 'We could not send that just now. Please wait a minute and try again.' })
    } finally {
      setBusy(null)
    }
  }

  async function checkNow() {
    setBusy('check')
    setStatus(null)
    try {
      await auth.currentUser?.reload()
      await auth.currentUser?.getIdToken(true)
      if (auth.currentUser?.emailVerified) {
        window.location.reload()
        return
      }
      setStatus({ tone: 'bad', text: "We don't see a verified email yet. Open the link in your email, then try again." })
    } catch {
      setStatus({ tone: 'bad', text: 'Something went wrong. Please try again.' })
    } finally {
      setBusy(null)
    }
  }

  return { user, busy, status, resend, checkNow }
}

function StatusLine({ status }: { status: Status }) {
  if (!status) return null
  return (
    <p
      role="status"
      className={
        status.tone === 'ok'
          ? 'rounded-xl bg-ok-soft px-4 py-3 text-sm font-medium text-ok'
          : 'rounded-xl bg-bad-soft px-4 py-3 text-sm font-medium text-bad'
      }
    >
      {status.text}
    </p>
  )
}

/** Full-screen gate, used when VITE_REQUIRE_VERIFIED_EMAIL=true. */
export function VerifyEmailGate() {
  const { user, busy, status, resend, checkNow } = useVerifyActions()
  return (
    <AuthLayout
      title="Verify your email"
      subtitle={`We sent a link to ${user?.email ?? 'your email'}. Open it to confirm this is really you.`}
      footer={
        <button type="button" className="font-semibold text-info hover:underline" onClick={() => signOut(auth)}>
          Use a different account
        </button>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-2xl bg-info-soft p-4 text-sm text-fg">
          <MailCheck className="size-6 shrink-0 text-info" aria-hidden />
          <p>Verified accounts keep hours trustworthy for everyone, and keep spam and fake accounts out.</p>
        </div>
        <StatusLine status={status} />
        <Button size="lg" className="w-full" loading={busy === 'check'} onClick={checkNow}>
          I've verified my email
        </Button>
        <Button variant="secondary" size="lg" className="w-full" loading={busy === 'resend'} onClick={resend}>
          Resend the email
        </Button>
      </div>
    </AuthLayout>
  )
}

/** Non-blocking reminder shown while verification is optional. */
export function VerifyEmailBanner() {
  const { busy, status, resend } = useVerifyActions()
  return (
    <div className="border-b border-line bg-warn-soft px-4 py-2 text-sm text-fg">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-1">
        <MailCheck className="size-4 text-warn" aria-hidden />
        <span className="font-medium">Please verify your email address.</span>
        <button
          type="button"
          disabled={busy === 'resend'}
          onClick={resend}
          className="font-semibold text-info hover:underline disabled:opacity-60"
        >
          Resend the link
        </button>
        {status && <span className={status.tone === 'ok' ? 'text-ok' : 'text-bad'}>{status.text}</span>}
      </div>
    </div>
  )
}
