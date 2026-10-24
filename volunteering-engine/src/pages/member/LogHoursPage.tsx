import { zodResolver } from '@hookform/resolvers/zod'
import { Building2, CircleCheck, ClipboardList } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { PetSprite } from '../../components/pets/PetSprite'
import { Badge, type BadgeTone } from '../../components/ui/Badge'
import { Button, ButtonLink } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Field, Input, Select, Textarea } from '../../components/ui/Field'
import { EmptyState, Page, PageHeader, Section } from '../../components/ui/Page'
import { Skeleton } from '../../components/ui/Skeleton'
import { useAuth } from '../../context/AuthProvider'
import { useMyPets } from '../../hooks/useMyPets'
import { useOrgApplications } from '../../hooks/useOrgApplications'
import { submitHourLog, subscribeMyHourLogs } from '../../lib/firestore/hourLogs'
import { subscribeApprovedOrganizations } from '../../lib/firestore/organizations'
import { DEFAULT_PET_ID, petStageLabel } from '../../lib/petVisuals'
import type { HourLog, Organization } from '../../types/models'

const schema = z.object({
  orgId: z.string().min(1, 'Choose an organization'),
  petId: z.string().min(1, 'Choose a pet'),
  date: z.string().min(1, 'Choose a date'),
  hours: z.coerce.number().positive('Enter hours greater than 0'),
  description: z.string().min(3, 'Briefly describe what you did'),
})

type FormInput = z.input<typeof schema>
type FormValues = z.output<typeof schema>

const statusTone: Record<HourLog['status'], BadgeTone> = {
  pending: 'warn',
  approved: 'ok',
  rejected: 'bad',
}

export function LogHoursPage() {
  const { user } = useAuth()
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [myLogs, setMyLogs] = useState<HourLog[]>([])
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const pets = useMyPets()
  const { applications, loadState } = useOrgApplications()
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { petId: DEFAULT_PET_ID },
  })
  const chosenPetId = useWatch({ control, name: 'petId' })
  const chosenPet = pets.find((p) => p.species === chosenPetId)

  useEffect(() => {
    return subscribeApprovedOrganizations(setOrgs)
  }, [])

  useEffect(() => {
    if (!user) return
    return subscribeMyHourLogs(user.uid, setMyLogs)
  }, [user])

  // Hours are signed off by the organization, so a volunteer can only log
  // them for organizations they have actually joined (the security rules
  // enforce this too).
  const joinedOrgs = orgs.filter((org) => applications[org.orgId] === 'approved')
  const waitingOrgs = orgs.filter((org) => applications[org.orgId] === 'applied')

  async function onSubmit(values: FormValues) {
    if (!user) return
    setError(null)
    setSubmitted(false)
    try {
      await submitHourLog({
        memberUid: user.uid,
        orgId: values.orgId,
        petId: values.petId,
        date: values.date,
        hours: values.hours,
        description: values.description,
      })
      reset()
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit this log. Try again.')
    }
  }

  return (
    <Page width="narrow">
      <PageHeader title="Log hours" description="Submit your hours for the organization to sign off." />

      {loadState === 'loading' && <Skeleton className="h-96" />}

      {loadState === 'error' && (
        <p role="alert" className="rounded-2xl bg-bad-soft px-4 py-3 text-sm font-medium text-bad">
          We couldn&apos;t check which organizations you&apos;ve joined. Reload the page to try again.
        </p>
      )}

      {loadState === 'ready' && joinedOrgs.length === 0 && (
        <EmptyState
          icon={Building2}
          title="Join an organization to log hours"
          description={
            waitingOrgs.length > 0
              ? `Your application to ${waitingOrgs.map((o) => o.name).join(', ')} is waiting for approval. You can log hours once they accept you.`
              : 'Hours are signed off by the organization, so you need to be an approved member first. Apply from your dashboard or the map.'
          }
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <ButtonLink to="/member">Find organizations</ButtonLink>
              <ButtonLink to="/map" variant="secondary">
                Open the map
              </ButtonLink>
            </div>
          }
        />
      )}

      {loadState === 'ready' && joinedOrgs.length > 0 && (
        <Card className="p-6">
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Field label="Organization" error={errors.orgId?.message}>
              <Select aria-invalid={!!errors.orgId} {...register('orgId')}>
                <option value="">Select an organization</option>
                {joinedOrgs.map((org) => (
                  <option key={org.orgId} value={org.orgId}>
                    {org.name}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Date" error={errors.date?.message}>
                <Input type="date" aria-invalid={!!errors.date} {...register('date')} />
              </Field>
              <Field label="Hours" error={errors.hours?.message}>
                <Input type="number" step="0.25" aria-invalid={!!errors.hours} {...register('hours')} />
              </Field>
            </div>

            <Field
              label="Give these hours to"
              hint="The pet receives the hours once the organization approves them."
              error={errors.petId?.message}
            >
              <span className="flex items-center gap-3 rounded-2xl bg-surface-2 p-3">
                {chosenPet && <PetSprite species={chosenPet.species} stage={chosenPet.stage} size={48} />}
                <Select aria-invalid={!!errors.petId} {...register('petId')}>
                  {pets.map((pet) => (
                    <option key={pet.species} value={pet.species}>
                      {pet.name} — {pet.xp}h · {petStageLabel(pet.stage)}
                    </option>
                  ))}
                </Select>
              </span>
            </Field>

            <Field label="What did you do?" error={errors.description?.message}>
              <Textarea rows={3} aria-invalid={!!errors.description} {...register('description')} />
            </Field>

            {error && (
              <p role="alert" className="rounded-xl bg-bad-soft px-4 py-3 text-sm font-medium text-bad">
                {error}
              </p>
            )}
            {submitted && (
              <p
                role="status"
                className="flex items-center gap-2 rounded-xl bg-ok-soft px-4 py-3 text-sm font-medium text-ok"
              >
                <CircleCheck className="size-4" aria-hidden />
                Submitted — pending organization sign-off.
              </p>
            )}

            <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
              {isSubmitting ? 'Submitting…' : 'Submit hours'}
            </Button>
          </form>
        </Card>
      )}

      <Section title="Your submissions">
        {myLogs.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No hours logged yet"
            description="Your submissions will show up here."
          />
        ) : (
          <ul className="space-y-2">
            {myLogs.map((log) => (
              <li key={log.logId}>
                <Card className="flex items-center justify-between gap-4 px-4 py-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-fg tabular-nums">
                      {log.hours}h <span className="font-normal text-muted">· {log.date}</span>
                    </p>
                    <p className="truncate text-sm text-muted">{log.description}</p>
                  </div>
                  <Badge tone={statusTone[log.status]} className="capitalize">
                    {log.status}
                  </Badge>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </Page>
  )
}
