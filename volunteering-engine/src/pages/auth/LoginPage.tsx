import { zodResolver } from '@hookform/resolvers/zod'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { AuthLayout } from '../../components/layout/AuthLayout'
import { Button } from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Field'
import { auth } from '../../lib/firebase'
import { getUserProfile } from '../../lib/firestore/users'
import { effectiveAccountType, homePathFor } from '../../lib/roles'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Enter your password'),
})

type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })
  const email = useWatch({ control, name: 'email' })

  async function onSubmit(values: FormValues) {
    setError(null)
    try {
      const credential = await signInWithEmailAndPassword(auth, values.email, values.password)
      const profile = await getUserProfile(credential.user.uid)
      navigate(profile ? homePathFor(effectiveAccountType(credential.user.uid, profile.accountType)) : '/')
    } catch {
      setError('Invalid email or password.')
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to see your hours, pets and opportunities."
      footer={
        <>
          Need an account?{' '}
          <Link to="/signup" className="font-semibold text-info hover:underline">
            Sign up
          </Link>
        </>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Field label="Email" error={errors.email?.message}>
          <Input type="email" autoComplete="email" aria-invalid={!!errors.email} {...register('email')} />
        </Field>

        <Field label="Password" error={errors.password?.message}>
          <Input
            type="password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            {...register('password')}
          />
        </Field>
        <div className="-mt-3 text-right">
          <Link to="/forgot-password" state={{ email }} className="text-sm font-semibold text-info hover:underline">
            Forgot password?
          </Link>
        </div>

        {error && (
          <p role="alert" className="rounded-xl bg-bad-soft px-4 py-3 text-sm font-medium text-bad">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
          {isSubmitting ? 'Logging in…' : 'Log in'}
        </Button>
      </form>
    </AuthLayout>
  )
}
