import { zodResolver } from '@hookform/resolvers/zod'
import { FirebaseError } from 'firebase/app'
import { sendPasswordResetEmail } from 'firebase/auth'
import { MailCheck } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation } from 'react-router-dom'
import { z } from 'zod'
import { AuthLayout } from '../../components/layout/AuthLayout'
import { Button } from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Field'
import { auth } from '../../lib/firebase'

const schema = z.object({
  email: z.string().min(1, 'Enter your email').email('Enter a valid email address'),
})

type FormValues = z.infer<typeof schema>

async function sendResetEmail(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email, { url: `${window.location.origin}/login` })
  } catch (error) {
    if (
      error instanceof FirebaseError &&
      (error.code === 'auth/unauthorized-continue-uri' || error.code === 'auth/invalid-continue-uri')
    ) {
      await sendPasswordResetEmail(auth, email)
      return
    }
    throw error
  }
}

function messageFor(error: unknown): string {
  switch (error instanceof FirebaseError ? error.code : '') {
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a few minutes and try again.'
    case 'auth/network-request-failed':
      return 'Could not reach the server. Check your connection and try again.'
    default:
      return 'Could not send the email. Try again.'
  }
}

export function ForgotPasswordPage() {
  const location = useLocation()
  const typed = (location.state as { email?: unknown } | null)?.email
  const [error, setError] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: typeof typed === 'string' ? typed : '' },
  })

  async function onSubmit({ email }: FormValues) {
    setError(null)
    try {
      await sendResetEmail(email)
      setSentTo(email)
    } catch (err) {
      if (err instanceof FirebaseError && err.code === 'auth/user-not-found') setSentTo(email)
      else setError(messageFor(err))
    }
  }

  const footer = (
    <Link to="/login" className="font-semibold text-info hover:underline">
      Back to log in
    </Link>
  )

  if (sentTo) {
    return (
      <AuthLayout title="Check your email" subtitle="We've sent you a way to choose a new password." footer={footer}>
        <div role="status" className="rounded-2xl border border-line bg-surface p-5">
          <span className="grid size-11 place-items-center rounded-2xl bg-info-soft text-info">
            <MailCheck className="size-5" aria-hidden />
          </span>
          <p className="mt-4 text-fg">
            If there is an account for <span className="font-semibold break-all">{sentTo}</span>, a link to reset its
            password is on its way.
          </p>
          <p className="mt-2 text-sm text-muted">
            It can take a few minutes to arrive. Check your spam folder if you don't see it.
          </p>
        </div>
        <Button variant="secondary" className="mt-5 w-full" onClick={() => setSentTo(null)}>
          Use a different email
        </Button>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter the email you signed up with and we'll send you a link to choose a new one."
      footer={footer}
    >
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Field label="Email" error={errors.email?.message}>
          <Input type="email" autoComplete="email" aria-invalid={!!errors.email} {...register('email')} />
        </Field>

        {error && (
          <p role="alert" className="rounded-xl bg-bad-soft px-4 py-3 text-sm font-medium text-bad">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
          {isSubmitting ? 'Sending…' : 'Send reset link'}
        </Button>
      </form>
    </AuthLayout>
  )
}
