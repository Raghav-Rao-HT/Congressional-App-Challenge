/** An IRS Employer Identification Number is 9 digits, conventionally written NN-NNNNNNN. */
export function normalizeEin(input: string): string | null {
  const digits = input.replace(/[\s-]/g, '')
  if (!/^\d{9}$/.test(digits)) return null
  return `${digits.slice(0, 2)}-${digits.slice(2)}`
}

export function einDigits(ein: string): string {
  return ein.replace(/\D/g, '')
}

/** Public, no-login pages that show an org's IRS record. Admins use them to verify 501(c)(3) status. */
export function propublicaUrl(ein: string): string {
  return `https://projects.propublica.org/nonprofits/organizations/${einDigits(ein)}`
}

export const IRS_TEOS_URL = 'https://apps.irs.gov/app/eos/'
export const IRS_REVOCATION_LIST_URL = 'https://www.irs.gov/charities-non-profits/automatic-revocation-of-exemption-list'

function hostOf(value: string): string | null {
  try {
    return new URL(value.includes('://') ? value : `https://${value}`).hostname.replace(/^www\./i, '').toLowerCase()
  } catch {
    return null
  }
}

/**
 * Does the registrant's contact email live on the organization's own website domain?
 * A strong, zero-friction signal that the person is affiliated with the org (free-mail addresses
 * never match, which simply routes the org to the admin's manual affiliation check).
 */
export function emailMatchesWebsite(email: string, website: string): boolean {
  const emailHost = email.split('@')[1]?.toLowerCase()
  const siteHost = hostOf(website)
  if (!emailHost || !siteHost) return false
  return emailHost === siteHost || emailHost.endsWith(`.${siteHost}`) || siteHost.endsWith(`.${emailHost}`)
}
