import { zodResolver } from '@hookform/resolvers/zod'
import { Clock, Globe2, Lock } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { Button, ButtonLink } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Field, Input, Textarea } from '../../components/ui/Field'
import { Page, PageHeader } from '../../components/ui/Page'
import { useAuth } from '../../context/AuthProvider'
import { useMyOrganization } from '../../hooks/useOrg'
import { createBulletinPost } from '../../lib/firestore/bulletinPosts'

const schema = z.object({
  audience: z.enum(['public', 'members']),
  offersServiceHours: z.enum(['yes', 'no'], { error: 'Choose whether this event gives service hours' }),
  title: z.string().min(2, 'Enter a title'),
  description: z.string().min(3, 'Describe the opportunity'),
  startAt: z.string().min(1, 'Choose a start date'),
  endAt: z.string().min(1, 'Choose an end date'),
  city: z.string().min(1, 'Enter a city'),
  state: z.string().min(2, 'Enter a state'),
  address: z.string().optional(),
  tags: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

function localDateMillis(dateStr: string): number {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day).getTime()
}

const radioCard =
  'flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-line bg-surface p-4 transition hover:border-brand-300 ' +
  'has-[:checked]:border-brand-500 has-[:checked]:bg-info-soft'

export function NewEventPage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { org } = useMyOrganization()
  const [error, setError] = useState<string | null>(null)

  const isOfficer = profile?.accountType === 'organization_officer'
  const officerOrgId = isOfficer ? (profile?.orgId ?? null) : null

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { audience: officerOrgId && searchParams.get('for') === 'members' ? 'members' : 'public' },
  })

  if (isOfficer && !officerOrgId) {
    return (
      <Page width="narrow">
        <PageHeader
          title="Post an opportunity"
          description="Your organization has to be approved by an admin before you can post opportunities."
        />
        <ButtonLink to="/org" variant="secondary">
          Back to your organization
        </ButtonLink>
      </Page>
    )
  }

  async function onSubmit(values: FormValues) {
    if (!user || !profile) return
    setError(null)
    try {
      await createBulletinPost({
        authorUid: user.uid,
        authorType: officerOrgId ? 'org' : 'member',
        orgId: officerOrgId,
        audience: officerOrgId ? values.audience : 'public',
        offersServiceHours: values.offersServiceHours === 'yes',
        title: values.title,
        description: values.description,
        startAt: localDateMillis(values.startAt),
        endAt: localDateMillis(values.endAt),
        location: { address: values.address ?? '', city: values.city, state: values.state.toUpperCase() },
        tags: values.tags ? values.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      })
      navigate('/bulletin')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not post this opportunity. Try again.')
    }
  }

  return (
    <Page width="narrow">
      <PageHeader
        title="Post an opportunity"
        description="Share an event or volunteer need. People can RSVP and you approve who joins."
        back={{ to: '/bulletin', label: 'Bulletin board' }}
      />

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
        {officerOrgId && (
          <Card className="p-6">
            <fieldset>
              <legend className="mb-3 text-base font-semibold text-fg">Who can see this?</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className={radioCard}>
                  <input type="radio" value="public" {...register('audience')} className="mt-1 accent-brand-600" />
                  <span>
                    <span className="flex items-start gap-1.5 font-semibold text-fg">
                      <Globe2 className="mt-0.5 size-4 shrink-0" aria-hidden />
                      Everyone
                    </span>
                    <span className="mt-0.5 block text-sm text-muted">Shown to all signed-in volunteers.</span>
                  </span>
                </label>
                <label className={radioCard}>
                  <input type="radio" value="members" {...register('audience')} className="mt-1 accent-brand-600" />
                  <span>
                    <span className="flex items-start gap-1.5 font-semibold text-fg">
                      <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
                      {org ? `${org.name} members only` : 'Our members only'}
                    </span>
                    <span className="mt-0.5 block text-sm text-muted">Only your approved members can see and RSVP.</span>
                  </span>
                </label>
              </div>
            </fieldset>
          </Card>
        )}

        <Card className="p-6">
          <fieldset aria-describedby={errors.offersServiceHours ? 'service-hours-error' : undefined}>
            <legend className="mb-3 text-base font-semibold text-fg">Does this event give service hours?</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={radioCard}>
                <input type="radio" value="yes" {...register('offersServiceHours')} className="mt-1 accent-brand-600" />
                <span>
                  <span className="flex items-start gap-1.5 font-semibold text-fg">
                    <Clock className="mt-0.5 size-4 shrink-0" aria-hidden />
                    Yes, it gives service hours
                  </span>
                  <span className="mt-0.5 block text-sm text-muted">People who take part can count their time as service hours.</span>
                </span>
              </label>
              <label className={radioCard}>
                <input type="radio" value="no" {...register('offersServiceHours')} className="mt-1 accent-brand-600" />
                <span>
                  <span className="font-semibold text-fg">No, it doesn't</span>
                  <span className="mt-0.5 block text-sm text-muted">A meeting, social or other event that doesn't count as service hours.</span>
                </span>
              </label>
            </div>
            {errors.offersServiceHours && (
              <p id="service-hours-error" role="alert" className="mt-2 text-xs font-medium text-bad">
                {errors.offersServiceHours.message}
              </p>
            )}
          </fieldset>
        </Card>

        <Card className="space-y-5 p-6">
          <Field label="Title" error={errors.title?.message}>
            <Input aria-invalid={!!errors.title} {...register('title')} />
          </Field>
          <Field label="Description" error={errors.description?.message}>
            <Textarea rows={4} aria-invalid={!!errors.description} {...register('description')} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Start" error={errors.startAt?.message}>
              <Input type="date" aria-invalid={!!errors.startAt} {...register('startAt')} />
            </Field>
            <Field label="End" error={errors.endAt?.message}>
              <Input type="date" aria-invalid={!!errors.endAt} {...register('endAt')} />
            </Field>
          </div>
        </Card>

        <Card className="space-y-5 p-6">
          <Field label="Address (optional)">
            <Input {...register('address')} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="City" error={errors.city?.message}>
              <Input aria-invalid={!!errors.city} {...register('city')} />
            </Field>
            <Field label="State" error={errors.state?.message}>
              <Input maxLength={2} placeholder="NJ" aria-invalid={!!errors.state} {...register('state')} />
            </Field>
          </div>
          <Field label="Tags (optional)" hint="Comma-separated, e.g. Animals, Outdoors">
            <Input placeholder="Animals, Outdoors" {...register('tags')} />
          </Field>
        </Card>

        {error && (
          <p role="alert" className="rounded-xl bg-bad-soft px-4 py-3 text-sm font-medium text-bad">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
          {isSubmitting ? 'Posting…' : 'Post opportunity'}
        </Button>
      </form>
    </Page>
  )
}
