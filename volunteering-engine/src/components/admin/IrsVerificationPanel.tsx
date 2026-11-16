import { BadgeCheck, ExternalLink, ShieldAlert } from 'lucide-react'
import { useState } from 'react'
import { emailMatchesWebsite, IRS_REVOCATION_LIST_URL, IRS_TEOS_URL, normalizeEin, propublicaUrl } from '../../lib/ein'
import type { Organization } from '../../types/models'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Field, Input } from '../ui/Field'

export interface IrsVerificationResult {
  ein: string
  source: string
}

type Mode = 'approve' | 'record'

function Check({ checked, onChange, children }: { checked: boolean; onChange: (next: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-sm text-fg">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-4 shrink-0 accent-brand-600"
      />
      <span>{children}</span>
    </label>
  )
}

function ExternalLinkItem({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 font-semibold text-info hover:underline"
    >
      {children}
      <ExternalLink className="size-3.5" aria-hidden />
    </a>
  )
}

/**
 * The 501(c)(3) gate. Every organization must be a recognized, active 501(c)(3) before it can approve
 * hours. An admin looks the EIN up on the public IRS record, ticks what they confirmed, and the result
 * is stamped on the org (who, when, what). firestore.rules refuse to approve an org without that stamp,
 * and officers cannot edit it.
 */
export function IrsVerificationPanel({
  org,
  mode,
  busy,
  onConfirm,
}: {
  org: Organization
  mode: Mode
  busy: boolean
  onConfirm: (result: IrsVerificationResult) => void
}) {
  const [einInput, setEinInput] = useState(org.ein ?? '')
  const [nameMatches, setNameMatches] = useState(false)
  const [recognized, setRecognized] = useState(false)
  const [notRevoked, setNotRevoked] = useState(false)
  const [affiliated, setAffiliated] = useState(false)

  const ein = normalizeEin(einInput)
  const domainMatch = emailMatchesWebsite(org.contactEmail, org.website)
  const allChecked = nameMatches && recognized && notRevoked && affiliated
  const ready = ein !== null && allChecked

  function confirm() {
    if (!ein || !allChecked) return
    const affiliation = domainMatch
      ? "the registrant's email is on the organization's website domain"
      : 'affiliation confirmed by the admin'
    onConfirm({
      ein,
      source: `Admin checked public IRS records (ProPublica Nonprofit Explorer / IRS TEOS): recognized 501(c)(3), exempt status active, not on the auto-revocation list, name and state match; ${affiliation}.`,
    })
  }

  return (
    <Card className="mt-6 space-y-5 p-6">
      <div className="flex items-start gap-3">
        <ShieldAlert className="mt-0.5 size-5 shrink-0 text-warn" aria-hidden />
        <div>
          <h2 className="text-base font-semibold text-fg">Verify 501(c)(3) status</h2>
          <p className="mt-1 text-sm text-muted">
            Only IRS-recognized 501(c)(3) nonprofits may vouch for volunteer hours. Look up the EIN, then confirm each
            point below.
          </p>
        </div>
      </div>

      <Field
        label="EIN"
        hint="9 digits, e.g. 12-3456789"
        error={einInput && !ein ? 'That is not a valid 9-digit EIN' : undefined}
      >
        <Input inputMode="numeric" value={einInput} onChange={(event) => setEinInput(event.target.value)} />
      </Field>

      <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
        {ein ? (
          <ExternalLinkItem href={propublicaUrl(ein)}>This EIN on ProPublica Nonprofit Explorer</ExternalLinkItem>
        ) : (
          <span className="text-muted">Enter a valid EIN to open its IRS record</span>
        )}
        <ExternalLinkItem href={IRS_TEOS_URL}>IRS Tax Exempt Organization Search</ExternalLinkItem>
        <ExternalLinkItem href={IRS_REVOCATION_LIST_URL}>IRS auto-revocation list</ExternalLinkItem>
      </div>

      <div
        className={
          domainMatch
            ? 'rounded-xl bg-ok-soft px-4 py-3 text-sm text-ok'
            : 'rounded-xl bg-warn-soft px-4 py-3 text-sm text-fg'
        }
      >
        {domainMatch
          ? `The registrant's email (${org.contactEmail}) is on the organization's website domain — a strong sign they belong to it.`
          : `The registrant's email (${org.contactEmail}) does not match the organization's website${org.website ? ` (${org.website})` : ''}. Confirm they are connected to the organization (call or email a contact listed on its IRS filing or website) before ticking the last box.`}
      </div>

      <div className="space-y-3">
        <Check checked={nameMatches} onChange={setNameMatches}>
          The IRS record for this EIN matches the legal name <strong>{org.legalName}</strong> and the state{' '}
          <strong>{org.address.state}</strong>.
        </Check>
        <Check checked={recognized} onChange={setRecognized}>
          The IRS lists it as a <strong>501(c)(3)</strong> (subsection 03) with exempt status <strong>01</strong>{' '}
          (unconditional exemption) — recognized and active.
        </Check>
        <Check checked={notRevoked} onChange={setNotRevoked}>
          It is <strong>not</strong> on the IRS automatic-revocation list (or was reinstated).
        </Check>
        <Check checked={affiliated} onChange={setAffiliated}>
          The person who registered it is connected to the organization.
        </Check>
      </div>

      <Button variant="success" size="lg" disabled={!ready} loading={busy} onClick={confirm}>
        <BadgeCheck className="size-5" aria-hidden />
        {mode === 'approve' ? 'Verify and approve' : 'Record verification'}
      </Button>
      {!ready && (
        <p className="text-xs text-muted">
          {ein ? 'Tick all four checks to continue.' : 'Enter a valid EIN and tick all four checks to continue.'}
        </p>
      )}
    </Card>
  )
}

export function IrsVerifiedNote({ org }: { org: Organization }) {
  if (!org.irsVerifiedAt) return null
  return (
    <Card className="mt-6 flex items-start gap-3 p-5">
      <BadgeCheck className="mt-0.5 size-5 shrink-0 text-ok" aria-hidden />
      <div className="text-sm">
        <p className="font-semibold text-fg">
          501(c)(3) verified {new Date(org.irsVerifiedAt).toLocaleDateString()}
          {org.ein ? ` · EIN ${org.ein}` : ''}
        </p>
        {org.irsVerifiedSource && <p className="mt-1 text-muted">{org.irsVerifiedSource}</p>}
      </div>
    </Card>
  )
}
