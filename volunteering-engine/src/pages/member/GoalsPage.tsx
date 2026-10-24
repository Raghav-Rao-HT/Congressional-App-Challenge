import { zodResolver } from '@hookform/resolvers/zod'
import { Target } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Badge, type BadgeTone } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Field, Input, Select } from '../../components/ui/Field'
import { EmptyState, Page, PageHeader, Section } from '../../components/ui/Page'
import { useAuth } from '../../context/AuthProvider'
import { createGoal, subscribeMyGoals } from '../../lib/firestore/goals'
import { subscribeApprovedOrganizations } from '../../lib/firestore/organizations'
import type { Goal, Organization } from '../../types/models'

const schema = z.object({
  orgId: z.string(),
  targetHours: z.coerce.number().positive('Enter hours greater than 0'),
  periodStart: z.string().min(1, 'Choose a start date'),
  periodEnd: z.string().min(1, 'Choose an end date'),
})

type FormInput = z.input<typeof schema>
type FormValues = z.output<typeof schema>

const statusTone: Record<Goal['status'], BadgeTone> = {
  active: 'brand',
  completed: 'ok',
  missed: 'bad',
}

export function GoalsPage() {
  const { user } = useAuth()
  const [goals, setGoals] = useState<Goal[]>([])
  const [orgs, setOrgs] = useState<Organization[]>([])
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormValues>({ resolver: zodResolver(schema), defaultValues: { orgId: '' } })

  useEffect(() => {
    if (!user) return
    return subscribeMyGoals(user.uid, setGoals)
  }, [user])

  useEffect(() => subscribeApprovedOrganizations(setOrgs), [])

  async function onSubmit(values: FormValues) {
    if (!user) return
    await createGoal({
      uid: user.uid,
      orgId: values.orgId || null,
      targetHours: values.targetHours,
      periodStart: values.periodStart,
      periodEnd: values.periodEnd,
    })
    reset()
  }

  function orgName(orgId: string | null): string {
    if (!orgId) return 'Overall'
    return orgs.find((o) => o.orgId === orgId)?.name ?? orgId
  }

  return (
    <Page width="narrow">
      <PageHeader
        title="Goals"
        description="Set an hours target for a period and earn a bonus when you hit it."
      />

      <Card className="p-6">
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Field label="Organization" hint="Leave on Overall to count hours from any organization.">
            <Select {...register('orgId')}>
              <option value="">Overall (any organization)</option>
              {orgs.map((org) => (
                <option key={org.orgId} value={org.orgId}>
                  {org.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Target hours" error={errors.targetHours?.message}>
            <Input
              type="number"
              step="0.25"
              aria-invalid={!!errors.targetHours}
              {...register('targetHours')}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Start" error={errors.periodStart?.message}>
              <Input type="date" aria-invalid={!!errors.periodStart} {...register('periodStart')} />
            </Field>
            <Field label="End" error={errors.periodEnd?.message}>
              <Input type="date" aria-invalid={!!errors.periodEnd} {...register('periodEnd')} />
            </Field>
          </div>

          <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
            {isSubmitting ? 'Setting goal…' : 'Set goal'}
          </Button>
        </form>
      </Card>

      <Section title="Your goals">
        {goals.length === 0 ? (
          <EmptyState
            icon={Target}
            title="No goals yet"
            description="Set one above to start earning bonuses."
          />
        ) : (
          <ul className="space-y-3">
            {goals.map((goal) => {
              const pct = Math.min(100, Math.round((goal.progressHours / goal.targetHours) * 100))
              return (
                <li key={goal.goalId}>
                  <Card className="p-5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-fg">
                        {orgName(goal.orgId)}
                        <span className="ml-2 font-normal text-muted tabular-nums">
                          {goal.progressHours}/{goal.targetHours}h
                        </span>
                      </p>
                      <Badge tone={statusTone[goal.status]} className="capitalize">
                        {goal.status}
                      </Badge>
                    </div>
                    <div
                      className="mt-3 h-2.5 overflow-hidden rounded-full bg-surface-2"
                      role="progressbar"
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-500 to-coral-400 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-muted">
                      {goal.periodStart} – {goal.periodEnd}
                      {goal.bonusPointsAwarded && ` · +${goal.bonusAmount} bonus points`}
                    </p>
                  </Card>
                </li>
              )
            })}
          </ul>
        )}
      </Section>
    </Page>
  )
}
