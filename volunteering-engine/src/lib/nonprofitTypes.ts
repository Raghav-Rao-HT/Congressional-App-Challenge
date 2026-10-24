// Kinds of nonprofit an organization can pick at sign-up. Choosing "Other"
// lets them type their own, and that text is what gets stored.
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

export const OTHER_NONPROFIT_TYPE = 'Other'
