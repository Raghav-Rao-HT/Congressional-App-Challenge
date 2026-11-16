/**
 * Friend codes and join codes: 8 characters from a 32-symbol alphabet with no look-alikes (no I/O/0/1),
 * so ~10^12 possibilities. They are unguessable AND unlistable (firestore.rules forbids listing the
 * collections), which is what keeps students from being discoverable by strangers.
 *
 * The alphabet must stay in sync with the `^[A-HJ-NP-Z2-9]{8}$` pattern in firestore.rules and with
 * scripts/_codes.mjs. rules-tests/codes.test.ts fails if they drift apart.
 */
export const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export const CODE_LENGTH = 8

export function generateCode(): string {
  const bytes = new Uint8Array(CODE_LENGTH)
  crypto.getRandomValues(bytes)
  // 256 is a multiple of 32, so `% 32` is unbiased.
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('')
}

/** Accepts what people actually type or paste: lower case, spaces, dashes. Returns null if it can't be a code. */
export function normalizeCode(input: string): string | null {
  const cleaned = input.toUpperCase().replace(/[\s-]/g, '')
  return new RegExp(`^[${CODE_ALPHABET}]{${CODE_LENGTH}}$`).test(cleaned) ? cleaned : null
}

export function formatCode(code: string): string {
  return `${code.slice(0, 4)}-${code.slice(4)}`
}
