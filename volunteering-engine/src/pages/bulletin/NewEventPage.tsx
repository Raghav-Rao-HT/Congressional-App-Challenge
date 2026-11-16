import { zodResolver } from '@hookform/resolvers/zod'
import { Clock, Globe2, Lock, type LucideIcon } from 'lucide-react'
import { useState, type ComponentProps } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { Button, ButtonLink } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { DateRangePicker } from '../../components/ui/DateRangePicker'
import { Field, Input, Textarea } from '../../components/ui/Field'
import { Page, PageHeader } from '../../components/ui/Page'
import { useAuth } from '../../context/AuthProvider'
import { useMyOrganization } from '../../hooks/useOrg'
import { createBulletinPost } from '../../lib/firestore/bulletinPosts'
import { endOfDayMillis, startOfDayMillis, todayISO } from '../../lib/eventDates'

const schema = z
  .object({
    audience: z.enum(['public', 'members']),
    offersServiceHours: z.enum(['yes', 'no'], { error: 'Choose whether this event gives service hours' }),
    title: z.string().trim().min(2, 'Enter a title').max(120, 'At most 120 characters'),
    description: z.string().trim().min(3, 'Describe the opportunity').max(4000, 'At most 4,000 characters'),
    startAt: z.string().min(1, 'Choose a start date'),
    endAt: z.string().min(1, 'Choose an end date'),
    city: z.string().trim().min(1, 'Enter a city').max(80, 'At most 80 characters'),
    state: z.string().trim().min(2, 'Enter a state').max(40, 'At most 40 characters'),
    address: z.string().max(200, 'At most 200 characters').optional(),
    tags: z
      .string()
      .optional()
      .refine(
        (value) => !value || value.split(',').map((t) => t.trim()).filter(Boolean).length <= 10,
        'Use at most 10 tags',
      )
      .refine(
        (value) => !value || value.split(',').every((t) => t.trim().length <= 40),
        'Each tag can be at most 40 characters',
      ),
  })
  .superRefine((values, ctx) => {
    if (values.endAt && values.endAt < todayISO()) {
      ctx.addIssue({ code: 'custom', path: ['endAt'], message: "An event can't end on a day that has already passed" })
    } else if (values.startAt && values.endAt && values.endAt < values.startAt) {
      ctx.addIssue({ code: 'custom', path: ['endAt'], message: "The end date can't be before the start date" })
    }
  })

type FormValues = z.infer<typeof schema>

const radioCard =
  'flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-line bg-surface p-4 transition hover:border-brand-300 ' +
  'has-[:checked]:border-brand-500 has-[:checked]:bg-info-soft'

function Choice({
  icon: Icon,
  title,
  text,
  input,
}: {
  icon?: LucideIcon
  title: string
  text: string
  input: ComponentProps<'input'>
}) {
  return (
    <label className={radioCard}>
      <input type="radio" className="mt-1 accent-brand-600" {...input} />
      <span>
        <span className="flex items-start gap-1.5 font-semibold text-fg">
          {Icon && <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />}
          {title}
        </span>
        <span className="mt-0.5 block text-sm text-muted">{text}</span>
      </span>
    </label>
  )
}

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
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { audience: officerOrgId && searchParams.get('for') === 'members' ? 'members' : 'public' },
  })

  const [startAt, endAt] = useWatch({ control, name: ['startAt', 'endAt'] })

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
        startAt: startOfDayMillis(values.startAt),
        endAt: endOfDayMillis(values.endAt),
        location: { address: values.address ?? '', city: values.city, state: values.state.toUpperCase() },
        tags: values.tags ? values.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      })
      navigate('/bulletin')
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't post this opportunity.")
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
                <Choice
                  icon={Globe2}
                  title="Everyone"
                  text="Shown to all signed-in volunteers."
                  input={{ ...register('audience'), value: 'public' }}
                />
                <Choice
                  icon={Lock}
                  title={org ? `${org.name} members only` : 'Our members only'}
                  text="Only your approved members can see and RSVP."
                  input={{ ...register('audience'), value: 'members' }}
                />
              </div>
            </fieldset>
          </Card>
        )}

        <Card className="p-6">
          <fieldset aria-describedby={errors.offersServiceHours ? 'service-hours-error' : undefined}>
            <legend className="mb-3 text-base font-semibold text-fg">Does this event give service hours?</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <Choice
                icon={Clock}
                title="Yes, it gives service hours"
                text="People who take part can count their time as service hours."
                input={{ ...register('offersServiceHours'), value: 'yes' }}
              />
              <Choice
                title="No, it doesn't"
                text="A meeting, social or other event that doesn't count as service hours."
                input={{ ...register('offersServiceHours'), value: 'no' }}
              />
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
          <div>
            <p className="mb-1.5 text-sm font-medium text-fg">When is it?</p>
            <input type="hidden" {...register('startAt')} />
            <input type="hidden" {...register('endAt')} />
            <DateRangePicker
              start={startAt ?? ''}
              end={endAt ?? ''}
              invalid={!!errors.startAt || !!errors.endAt}
              onChange={(start, end) => {
                setValue('startAt', start, { shouldValidate: true })
                setValue('endAt', end, { shouldValidate: true })
              }}
            />
            {(errors.startAt || errors.endAt) && (
              <p role="alert" className="mt-1.5 text-xs font-medium text-bad">
                {errors.startAt?.message ?? errors.endAt?.message}
              </p>
            )}
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
          {isSubmitting ? 'Posting...' : 'Post opportunity'}
        </Button>
      </form>
    </Page>
  )
}
