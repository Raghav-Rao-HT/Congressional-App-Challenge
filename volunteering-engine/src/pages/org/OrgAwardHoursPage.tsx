import { zodResolver } from '@hookform/resolvers/zod'
import { Award, CircleCheck, Search, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Field, Input, Textarea } from '../../components/ui/Field'
import { EmptyState, Page, PageHeader, Section } from '../../components/ui/Page'
import { Skeleton } from '../../components/ui/Skeleton'
import { useAuth } from '../../context/AuthProvider'
import { useMyOrganization } from '../../hooks/useOrg'
import { normalizeCode } from '../../lib/codes'
import { todayISO } from '../../lib/eventDates'
import { lookupFriendCode } from '../../lib/firestore/friendships'
import { awardHours, subscribeOrgReviewedHourLogs } from '../../lib/firestore/hourLogs'
import { subscribeOrgMembers } from '../../lib/firestore/organizations'
import type { HourLog, OrgMember } from '../../types/models'

type Student = { uid: string; displayName: string }

const MAX_RESULTS = 8
const MAX_HOURS = 24
const MIN_QUERY_LENGTH = 2

const schema = z.object({
  date: z
    .string()
    .min(1, 'Choose a date')
    .refine((date) => date <= todayISO(), "The date can't be in the future"),
  hours: z.coerce
    .number()
    .positive('Enter hours greater than 0')
    .max(MAX_HOURS, `Award at most ${MAX_HOURS} hours at a time`),
  description: z.string().trim().min(3, 'Briefly say what the hours are for').max(500, 'At most 500 characters'),
})

type FormInput = z.input<typeof schema>
type FormValues = z.output<typeof schema>

function RosterBadge({ status }: { status: OrgMember['status'] | undefined }) {
  if (status === 'approved') return <Badge tone="ok">On your roster</Badge>
  if (status === 'applied') return <Badge tone="warn">Applied to join</Badge>
  return null
}

export function OrgAwardHoursPage() {
  const { user } = useAuth()
  const { org, loading } = useMyOrganization()
  const [members, setMembers] = useState<OrgMember[]>([])
  const [reviewed, setReviewed] = useState<HourLog[]>([])
  const [query, setQuery] = useState('')
  const [chosen, setChosen] = useState<Student | null>(null)
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState<string | null>(null)
  const [lookingUp, setLookingUp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { date: todayISO() },
  })

  useEffect(() => {
    if (!org) return
    return subscribeOrgMembers(org.orgId, setMembers)
  }, [org])

  useEffect(() => {
    if (!org) return
    return subscribeOrgReviewedHourLogs(org.orgId, setReviewed, 100)
  }, [org])

  const names = useMemo(() => new Map(members.map((m) => [m.uid, m.displayName])), [members])
  const awards = useMemo(() => reviewed.filter((log) => log.awardedByOrg).slice(0, 10), [reviewed])

  const needle = query.trim().toLowerCase()
  const results = useMemo(() => {
    if (needle.length < MIN_QUERY_LENGTH) return []
    return members
      .filter(
        (candidate) =>
          candidate.roleInOrg === 'member' &&
          candidate.uid !== user?.uid &&
          (candidate.status === 'approved' || candidate.status === 'applied') &&
          candidate.displayName.toLowerCase().includes(needle),
      )
      .sort((a, b) => a.displayName.localeCompare(b.displayName))
      .slice(0, MAX_RESULTS)
  }, [members, needle, user?.uid])

  async function findByCode() {
    setCodeError(null)
    if (!normalizeCode(code)) {
      setCodeError('A student code is 8 letters and numbers, like K7QM-4XPD.')
      return
    }
    setLookingUp(true)
    try {
      const found = await lookupFriendCode(code)
      if (!found) setCodeError("We couldn't find a student with that code.")
      else if (found.uid === user?.uid) setCodeError("That's your own code.")
      else {
        setChosen(found)
        setCode('')
        setDone(null)
        setError(null)
      }
    } catch {
      setCodeError("We couldn't look that up just now. Please try again.")
    } finally {
      setLookingUp(false)
    }
  }

  async function onSubmit(values: FormValues) {
    if (!user || !org) return
    if (!chosen) {
      setError('Search for a student first.')
      return
    }
    setError(null)
    setDone(null)
    try {
      await awardHours({
        orgId: org.orgId,
        officerUid: user.uid,
        memberUid: chosen.uid,
        memberName: chosen.displayName,
        date: values.date,
        hours: values.hours,
        description: values.description,
      })
      setDone(`Awarded ${values.hours}h to ${chosen.displayName}.`)
      setChosen(null)
      setQuery('')
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't award these hours.")
    }
  }

  if (loading) {
    return (
      <Page width="narrow">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="mt-8 h-64" />
      </Page>
    )
  }

  if (!org || org.status !== 'approved') {
    return (
      <Page width="narrow">
        <PageHeader title="Award hours" back={{ to: '/org', label: 'Dashboard' }} />
        <EmptyState
          icon={Award}
          title="Not available yet"
          description="You can award hours once an admin has approved your organization."
        />
      </Page>
    )
  }

  return (
    <Page width="narrow">
      <PageHeader
        title="Award hours"
        description="Credit a volunteer directly, without waiting for them to log the hours."
        back={{ to: '/org', label: 'Dashboard' }}
      />

      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Card className="p-5 sm:p-6">
          <h2 className="mb-3 text-sm font-medium text-fg">Student</h2>

          {chosen ? (
            <div className="flex items-center justify-between gap-3 rounded-xl bg-info-soft px-4 py-3">
              <span className="min-w-0">
                <span className="block truncate font-semibold text-fg">{chosen.displayName}</span>
              </span>
              <Button size="sm" variant="secondary" onClick={() => setChosen(null)}>
                <X className="size-4" aria-hidden />
                Change
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <label className="relative block">
                  <span className="sr-only">Search your roster by name</span>
                  <Search
                    className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted"
                    aria-hidden
                  />
                  <Input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search your roster by name..."
                    autoComplete="off"
                    className="pl-10"
                  />
                </label>

                {needle.length >= MIN_QUERY_LENGTH && (
                  <div aria-live="polite">
                    {results.length === 0 ? (
                      <p className="mt-3 text-sm text-muted">No one on your roster matches &ldquo;{query.trim()}&rdquo;.</p>
                    ) : (
                      <ul className="mt-3 space-y-2">
                        {results.map((candidate) => (
                          <li key={candidate.uid}>
                            <button
                              type="button"
                              onClick={() => {
                                setChosen({ uid: candidate.uid, displayName: candidate.displayName })
                                setDone(null)
                                setError(null)
                              }}
                              className="flex w-full items-center justify-between gap-3 rounded-xl bg-surface-2 px-4 py-2.5 text-left transition hover:bg-info-soft"
                            >
                              <span className="truncate text-sm font-semibold text-fg">{candidate.displayName}</span>
                              <RosterBadge status={candidate.status} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t border-line pt-5">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-fg">Or add a student with their code</span>
                  <span className="flex gap-2">
                    <Input
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          findByCode()
                        }
                      }}
                      placeholder="K7QM-4XPD"
                      autoComplete="off"
                      spellCheck={false}
                      className="font-mono uppercase tracking-widest"
                    />
                    <Button type="button" variant="secondary" loading={lookingUp} onClick={findByCode}>
                      Find
                    </Button>
                  </span>
                </label>
                {codeError && (
                  <p role="alert" className="mt-2 text-sm font-medium text-bad">
                    {codeError}
                  </p>
                )}
                <p className="mt-2 text-xs text-muted">
                  Students find their code under Friends. Students who aren&apos;t on your roster yet are added to it when
                  you award them hours.
                </p>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Date" error={errors.date?.message}>
                <Input type="date" max={todayISO()} aria-invalid={!!errors.date} {...register('date')} />
              </Field>
              <Field label="Hours" error={errors.hours?.message}>
                <Input type="number" step="0.25" aria-invalid={!!errors.hours} {...register('hours')} />
              </Field>
            </div>

            <Field label="What are the hours for?" error={errors.description?.message}>
              <Textarea rows={3} aria-invalid={!!errors.description} {...register('description')} />
            </Field>

            {error && (
              <p role="alert" className="rounded-xl bg-bad-soft px-4 py-3 text-sm font-medium text-bad">
                {error}
              </p>
            )}
            {done && (
              <p role="status" className="flex items-center gap-2 rounded-xl bg-ok-soft px-4 py-3 text-sm font-medium text-ok">
                <CircleCheck className="size-4" aria-hidden />
                {done}
              </p>
            )}

            <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
              <Award className="size-4" aria-hidden />
              {isSubmitting ? 'Awarding...' : chosen ? `Award hours to ${chosen.displayName}` : 'Award hours'}
            </Button>
          </div>
        </Card>
      </form>

      <Section title="Recently awarded">
        {awards.length === 0 ? (
          <EmptyState icon={Award} title="Nothing awarded yet" description="Hours you award will be listed here." />
        ) : (
          <ul className="space-y-2">
            {awards.map((log) => (
              <li key={log.logId}>
                <Card className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-fg">{names.get(log.memberUid) ?? 'Volunteer'}</p>
                    <p className="truncate text-sm text-muted">{log.description}</p>
                  </div>
                  <p className="shrink-0 text-right font-semibold text-fg tabular-nums">
                    {log.hours}h
                    <span className="block text-xs font-normal text-muted">{log.date}</span>
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </Page>
  )
}
