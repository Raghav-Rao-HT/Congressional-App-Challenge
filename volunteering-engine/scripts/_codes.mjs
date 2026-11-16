import { randomInt } from 'node:crypto'

// Node twin of src/lib/codes.ts. The alphabet MUST match the one in the app and the `^[A-HJ-NP-Z2-9]{8}$`
// pattern in firestore.rules -- rules-tests/codes.test.ts fails if any of the three drift apart.
export const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export const CODE_LENGTH = 8

export function generateCode() {
  return Array.from({ length: CODE_LENGTH }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join('')
}
