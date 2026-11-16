import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { CODE_ALPHABET, CODE_LENGTH, formatCode, generateCode, normalizeCode } from '../src/lib/codes'
import * as nodeCodes from '../scripts/_codes.mjs'

// The same code alphabet is written down in three places: the app (src/lib/codes.ts), the maintenance
// scripts (scripts/_codes.mjs) and the pattern firestore.rules uses to accept a code. If they drift, valid
// codes get rejected (or invalid ones accepted) in production. This keeps them locked together.

const rules = readFileSync(resolve(__dirname, '../firestore.rules'), 'utf8')
const pattern = /function isCode\(v\) \{\s*return v is string && v\.matches\('([^']+)'\);/.exec(rules)?.[1]

describe('code alphabet', () => {
  it('is identical in the app, the scripts and firestore.rules', () => {
    expect(nodeCodes.CODE_ALPHABET).toBe(CODE_ALPHABET)
    expect(nodeCodes.CODE_LENGTH).toBe(CODE_LENGTH)
    expect(pattern, 'isCode() pattern not found in firestore.rules').toBeTruthy()

    const rulesRegex = new RegExp(pattern as string)
    for (const ch of CODE_ALPHABET) expect(rulesRegex.test(ch.repeat(CODE_LENGTH)), `rules reject ${ch}`).toBe(true)
    // Look-alikes and lower case must be refused by the rules too.
    for (const ch of 'IO01abcz') expect(rulesRegex.test(ch.repeat(CODE_LENGTH)), `rules accept ${ch}`).toBe(false)
    expect(rulesRegex.test('A'.repeat(CODE_LENGTH - 1))).toBe(false)
    expect(rulesRegex.test('A'.repeat(CODE_LENGTH + 1))).toBe(false)
  })

  it('has no look-alike characters and 32 symbols (so `% 32` is unbiased)', () => {
    expect(CODE_ALPHABET).toHaveLength(32)
    for (const ch of 'IO01') expect(CODE_ALPHABET).not.toContain(ch)
  })
})

describe('generateCode / normalizeCode', () => {
  it('generates codes the rules accept, and they are not repeating', () => {
    const rulesRegex = new RegExp(pattern as string)
    const seen = new Set<string>()
    for (let i = 0; i < 500; i += 1) {
      const code = generateCode()
      expect(rulesRegex.test(code)).toBe(true)
      expect(nodeCodes.generateCode()).toMatch(rulesRegex)
      seen.add(code)
    }
    expect(seen.size).toBe(500)
  })

  it('normalizes what people type, and rejects what cannot be a code', () => {
    expect(normalizeCode('k7qm-4xpd')).toBe('K7QM4XPD')
    expect(normalizeCode('  K7QM 4XPD ')).toBe('K7QM4XPD')
    expect(normalizeCode('K7QM4XP')).toBeNull()
    expect(normalizeCode('K7QM4XPD9')).toBeNull()
    expect(normalizeCode('K7QM4XP0')).toBeNull() // zero is not in the alphabet
    expect(normalizeCode('')).toBeNull()
    expect(formatCode('K7QM4XPD')).toBe('K7QM-4XPD')
  })
})
