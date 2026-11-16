import { defineConfig } from 'vitest/config'

// Only the Firestore-rules tests live under vitest. They need the emulator, so run them with
// `npm run test:rules` (which wraps this in `firebase emulators:exec`).
export default defineConfig({
  test: {
    include: ['rules-tests/**/*.test.ts'],
    environment: 'node',
    testTimeout: 30_000,
    hookTimeout: 60_000,
    fileParallelism: false,
  },
})
