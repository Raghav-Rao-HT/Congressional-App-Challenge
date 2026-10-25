import { zodResolver } from '@hookform/resolvers/zod'
import { MapPin } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { SelectWithOther } from '../../components/org/SelectWithOther'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Field, Input } from '../../components/ui/Field'
import { Page, PageHeader } from '../../components/ui/Page'
import { useAuth } from '../../context/AuthProvider'
import { createOrganization } from '../../lib/firestore/organizations'
import { geocodeAddress } from '../../lib/geocode'
import {
  IRS_CLASSIFICATIONS,
  NONPROFIT_TYPES,
  OTHER_NONPROFIT_TYPE,
  resolveChoice,
} from '../../lib/nonprofitTypes'

const schema = z.object({
  name: z.string().min(2, 'Enter your organization name'),
  legalName: z.string().min(2, 'Enter your legal/registered name'),
  street: z.string().min(2, 'Enter a street address'),
  city: z.string().min(1, 'Enter a city'),
  state: z.string().min(2, 'Enter a state'),
  zip: z.string().min(3, 'Enter a ZIP code'),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(7, 'Enter a phone number'),
  website: z
    .string()
    .url('Enter a full URL, e.g. https://example.org')
    .refine((value) => /^https?:\/\//i.test(value), 'The URL must start with http:// or https://')
    .or(z.literal('')),
  causeArea: z.string().min(2, 'Enter a cause area, e.g. Food Security'),
  // Normally chosen at sign-up. These are only asked for here by accounts
  // created before sign-up required them; onSubmit checks them in that case.
  nonprofitType: z.string(),
  nonprofitTypeOther: z.string(),
  irsClassification: z.string(),
  irsClassificationOther: z.string(),
})

type FormValues = z.infer<typeof schema>

const isMissing = (choice: string, other: string) => !choice || (choice === OTHER_NONPROFIT_TYPE && !other.trim())

export function OrgOnboardingPage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    watch,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nonprofitType: '', nonprofitTypeOther: '', irsClassification: '', irsClassificationOther: '' },
  })
  const needsType = !profile?.nonprofitType
  const needsIrs = !profile?.irsClassification
  const nonprofitChoice = watch('nonprofitType')
  const irsChoice = watch('irsClassification')

  async function onSubmit(values: FormValues) {
    if (!user || !profile) return
    setError(null)

    // Every organization needs both a type and an IRS classification.
    let incomplete = false
    if (needsType && isMissing(values.nonprofitType, values.nonprofitTypeOther)) {
      setFieldError(values.nonprofitType ? 'nonprofitTypeOther' : 'nonprofitType', { message: 'Tell us what type of nonprofit you are' })
      incomplete = true
    }
    if (needsIrs && isMissing(values.irsClassification, values.irsClassificationOther)) {
      setFieldError(values.irsClassification ? 'irsClassificationOther' : 'irsClassification', { message: 'Choose your IRS classification' })
      incomplete = true
    }
    if (incomplete) return

    try {
      const address = { street: values.street, city: values.city, state: values.state, zip: values.zip }
      // Locate the address first so the organization can be pinned on the
      // map; a bad address is reported here, before anything is saved.
      const location = await geocodeAddress(address)
      await createOrganization({
        submittedByUid: user.uid,
        submittedByDisplayName: profile.displayName,
        name: values.name,
        legalName: values.legalName,
        address,
        location,
        contactEmail: values.contactEmail,
        contactPhone: values.contactPhone,
        website: values.website,
        causeArea: values.causeArea,
        nonprofitType: profile.nonprofitType ?? resolveChoice(values.nonprofitType, values.nonprofitTypeOther),
        irsClassification: profile.irsClassification ?? resolveChoice(values.irsClassification, values.irsClassificationOther),
      })
      navigate('/org')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit your organization. Try again.')
    }
  }

  return (
    <Page width="narrow">
      <PageHeader
        title="Register your organization"
        description="Submitted organizations are reviewed by an admin before members can log hours against them."
      />

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Card className="space-y-5 p-6">
          <h2 className="text-base font-semibold text-fg">About your organization</h2>
          <Field label="Organization name" error={errors.name?.message}>
            <Input aria-invalid={!!errors.name} {...register('name')} />
          </Field>
          <Field label="Legal / registered name" error={errors.legalName?.message}>
            <Input aria-invalid={!!errors.legalName} {...register('legalName')} />
          </Field>
          <Field label="Cause area" error={errors.causeArea?.message}>
            <Input placeholder="e.g. Food Security" aria-invalid={!!errors.causeArea} {...register('causeArea')} />
          </Field>
          {needsType && (
            <SelectWithOther
              label="Type of nonprofit"
              options={NONPROFIT_TYPES}
              selected={nonprofitChoice}
              selectProps={register('nonprofitType')}
              selectError={errors.nonprofitType?.message}
              otherLabel="Describe your nonprofit"
              otherPlaceholder="e.g. Arts education"
              otherProps={register('nonprofitTypeOther')}
              otherError={errors.nonprofitTypeOther?.message}
            />
          )}
          {needsIrs && (
            <SelectWithOther
              label="IRS classification"
              options={IRS_CLASSIFICATIONS}
              selected={irsChoice}
              selectProps={register('irsClassification')}
              selectError={errors.irsClassification?.message}
              otherLabel="Your IRS classification"
              otherPlaceholder="e.g. 501(c)(12)"
              otherProps={register('irsClassificationOther')}
              otherError={errors.irsClassificationOther?.message}
            />
          )}
        </Card>

        <Card className="space-y-5 p-6">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-fg">
              <MapPin className="size-4 text-info" aria-hidden />
              Address
            </h2>
            <p className="mt-1 text-sm text-muted">We use this to place your organization on the New Jersey map.</p>
          </div>
          <Field label="Street address" error={errors.street?.message}>
            <Input autoComplete="street-address" aria-invalid={!!errors.street} {...register('street')} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="City" error={errors.city?.message} className="sm:col-span-1">
              <Input aria-invalid={!!errors.city} {...register('city')} />
            </Field>
            <Field label="State" error={errors.state?.message}>
              <Input placeholder="NJ" aria-invalid={!!errors.state} {...register('state')} />
            </Field>
            <Field label="ZIP" error={errors.zip?.message}>
              <Input inputMode="numeric" aria-invalid={!!errors.zip} {...register('zip')} />
            </Field>
          </div>
        </Card>

        <Card className="space-y-5 p-6">
          <h2 className="text-base font-semibold text-fg">Contact</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Contact email" error={errors.contactEmail?.message}>
              <Input type="email" aria-invalid={!!errors.contactEmail} {...register('contactEmail')} />
            </Field>
            <Field label="Contact phone" error={errors.contactPhone?.message}>
              <Input type="tel" aria-invalid={!!errors.contactPhone} {...register('contactPhone')} />
            </Field>
          </div>
          <Field label="Website (optional)" error={errors.website?.message}>
            <Input placeholder="https://" aria-invalid={!!errors.website} {...register('website')} />
          </Field>
        </Card>

        {error && (
          <p role="alert" className="rounded-xl bg-bad-soft px-4 py-3 text-sm font-medium text-bad">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
          {isSubmitting ? 'Locating address and submitting…' : 'Submit for approval'}
        </Button>
      </form>
    </Page>
  )
}
