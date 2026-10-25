import { zodResolver } from '@hookform/resolvers/zod'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { Building2, HandHeart, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { AuthLayout } from '../../components/layout/AuthLayout'
import { Button } from '../../components/ui/Button'
import { SelectWithOther } from '../../components/org/SelectWithOther'
import { Field, Input } from '../../components/ui/Field'
import { cn } from '../../lib/cn'
import { auth } from '../../lib/firebase'
import { createUserProfile } from '../../lib/firestore/users'
import {
  IRS_CLASSIFICATIONS,
  NONPROFIT_TYPES,
  OTHER_NONPROFIT_TYPE,
  resolveChoice,
} from '../../lib/nonprofitTypes'
import { homePathFor } from '../../lib/roles'

const schema = z
  .object({
    displayName: z.string().min(2, 'Enter your name or organization contact name'),
    homeState: z.string().min(2, 'Enter your state'),
    email: z.string().email(),
    password: z.string().min(8, 'At least 8 characters'),
    accountType: z.enum(['member', 'organization_officer']),
    nonprofitType: z.string(),
    nonprofitTypeOther: z.string(),
    irsClassification: z.string(),
    irsClassificationOther: z.string(),
  })
  .superRefine((values, ctx) => {
    if (values.accountType !== 'organization_officer') return
    // Organizations must say what kind of nonprofit they are and how the IRS
    // classifies them; "Other" in either list needs the text filled in.
    const required: [string, string, 'nonprofitType' | 'irsClassification', string, string][] = [
      [values.nonprofitType, values.nonprofitTypeOther, 'nonprofitType', 'Choose your type of nonprofit', 'Tell us what type of nonprofit you are'],
      [values.irsClassification, values.irsClassificationOther, 'irsClassification', 'Choose your IRS classification', 'Enter your IRS classification, e.g. 501(c)(12)'],
    ]
    for (const [choice, other, name, missing, missingOther] of required) {
      if (!choice) {
        ctx.addIssue({ code: 'custom', path: [name], message: missing })
      } else if (choice === OTHER_NONPROFIT_TYPE && !other.trim()) {
        ctx.addIssue({ code: 'custom', path: [`${name}Other`], message: missingOther })
      }
    }
  })

type FormValues = z.infer<typeof schema>

const ROLE_OPTIONS: { value: FormValues['accountType']; label: string; hint: string; icon: LucideIcon }[] = [
  { value: 'member', label: 'Volunteer', hint: 'Log hours and grow pets', icon: HandHeart },
  { value: 'organization_officer', label: 'Organization', hint: 'Sign off hours, post events', icon: Building2 },
]

export function SignupPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      accountType: 'member',
      nonprofitType: '',
      nonprofitTypeOther: '',
      irsClassification: '',
      irsClassificationOther: '',
    },
  })
  const accountType = watch('accountType')
  const nonprofitType = watch('nonprofitType')
  const irsClassification = watch('irsClassification')

  async function onSubmit(values: FormValues) {
    setError(null)
    try {
      const credential = await createUserWithEmailAndPassword(auth, values.email, values.password)
      await createUserProfile({
        uid: credential.user.uid,
        email: values.email,
        displayName: values.displayName,
        homeState: values.homeState,
        accountType: values.accountType,
        ...(values.accountType === 'organization_officer' && {
          nonprofitType: resolveChoice(values.nonprofitType, values.nonprofitTypeOther),
          irsClassification: resolveChoice(values.irsClassification, values.irsClassificationOther),
        }),
      })
      navigate(homePathFor(values.accountType))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.')
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Track volunteer hours, earn points, grow your pets."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-info hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div role="group" aria-label="Account type" className="grid grid-cols-2 gap-3">
          {ROLE_OPTIONS.map(({ value, label, hint, icon: Icon }) => {
            const selected = accountType === value
            return (
              <button
                key={value}
                type="button"
                aria-pressed={selected}
                onClick={() => setValue('accountType', value)}
                className={cn(
                  'flex flex-col items-start gap-2 rounded-2xl border-2 p-4 text-left transition',
                  selected
                    ? 'border-brand-500 bg-info-soft shadow-sm'
                    : 'border-line bg-surface hover:border-brand-300',
                )}
              >
                <Icon className={cn('size-6', selected ? 'text-info' : 'text-muted')} aria-hidden />
                <span>
                  <span className="block text-sm font-semibold text-fg">{label}</span>
                  <span className="block text-xs text-muted">{hint}</span>
                </span>
              </button>
            )
          })}
        </div>

        {accountType === 'organization_officer' && (
          <>
            <SelectWithOther
              label="Type of nonprofit"
              options={NONPROFIT_TYPES}
              selected={nonprofitType}
              selectProps={register('nonprofitType')}
              selectError={errors.nonprofitType?.message}
              otherLabel="Describe your nonprofit"
              otherPlaceholder="e.g. Arts education"
              otherProps={register('nonprofitTypeOther')}
              otherError={errors.nonprofitTypeOther?.message}
            />
            <SelectWithOther
              label="IRS classification"
              options={IRS_CLASSIFICATIONS}
              selected={irsClassification}
              selectProps={register('irsClassification')}
              selectError={errors.irsClassification?.message}
              otherLabel="Your IRS classification"
              otherPlaceholder="e.g. 501(c)(12)"
              otherProps={register('irsClassificationOther')}
              otherError={errors.irsClassificationOther?.message}
            />
          </>
        )}

        <Field
          label={accountType === 'organization_officer' ? 'Your name (org contact)' : 'Display name'}
          error={errors.displayName?.message}
        >
          <Input autoComplete="name" aria-invalid={!!errors.displayName} {...register('displayName')} />
        </Field>

        <Field label="State" error={errors.homeState?.message}>
          <Input placeholder="e.g. NJ" aria-invalid={!!errors.homeState} {...register('homeState')} />
        </Field>

        <Field label="Email" error={errors.email?.message}>
          <Input type="email" autoComplete="email" aria-invalid={!!errors.email} {...register('email')} />
        </Field>

        <Field label="Password" hint="At least 8 characters." error={errors.password?.message}>
          <Input
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            {...register('password')}
          />
        </Field>

        {error && (
          <p role="alert" className="rounded-xl bg-bad-soft px-4 py-3 text-sm font-medium text-bad">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
          {isSubmitting ? 'Creating account…' : 'Sign up'}
        </Button>
      </form>
    </AuthLayout>
  )
}
