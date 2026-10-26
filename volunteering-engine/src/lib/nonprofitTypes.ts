export const NONPROFIT_TYPES = [
  'Animal welfare',
  'Arts & culture',
  'Community development',
  'Education',
  'Environment',
  'Faith-based',
  'Food & hunger',
  'Health & wellness',
  'Housing & homelessness',
  'Veterans & military families',
  'Youth & family',
  'Other',
] as const

export const IRS_CLASSIFICATIONS = [
  '501(c)(3) Charitable, religious or educational',
  '501(c)(4) Social welfare or civic league',
  '501(c)(5) Labor or agricultural',
  '501(c)(6) Business league or chamber of commerce',
  '501(c)(7) Social or recreational club',
  '501(c)(8) Fraternal beneficiary society',
  '501(c)(10) Fraternal lodge',
  '501(c)(19) Veterans organization',
  'Other',
] as const

export const OTHER_NONPROFIT_TYPE = 'Other'

export function resolveChoice(choice: string, other: string): string {
  return choice === OTHER_NONPROFIT_TYPE ? other.trim() : choice
}
