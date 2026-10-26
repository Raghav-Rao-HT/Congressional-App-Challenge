import type { AccountType } from '../types/models'

export const SITE_OWNER_UID = 'HAwkbqkr4rYerePOfWxdQZn7tUG3'

export function isSiteOwner(uid: string | null | undefined): boolean {
  return !!uid && uid === SITE_OWNER_UID
}

export function effectiveAccountType(uid: string, stored: AccountType): AccountType {
  return isSiteOwner(uid) ? 'admin' : stored
}

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
