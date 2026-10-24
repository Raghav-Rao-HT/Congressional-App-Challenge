import type { AccountType } from '../types/models'

export function homePathFor(accountType: AccountType): string {
  switch (accountType) {
    case 'member':
      return '/member'
    case 'organization_officer':
      return '/org'
    case 'admin':
      return '/admin'
  }
}
