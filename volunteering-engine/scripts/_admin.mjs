import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

/**
 * Shared Admin-SDK bootstrap for the maintenance scripts. Safe by default: it targets the LOCAL EMULATORS
 * unless you explicitly opt in to the real project:
 *
 *   USE_EMULATOR=false GCLOUD_PROJECT=<project-id> node scripts/<script>.mjs
 *
 * Real-project runs use Application Default Credentials (`gcloud auth application-default login`), never a
 * key file in this repo.
 */
export function connectFirestore() {
  const useEmulator = process.env.USE_EMULATOR !== 'false'
  if (useEmulator) {
    process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080'
    process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099'
  }
  const projectId = process.env.GCLOUD_PROJECT ?? (useEmulator ? 'demo-volunteering-engine' : undefined)
  if (!projectId) {
    console.error('Set GCLOUD_PROJECT=<your-project-id> when USE_EMULATOR=false.')
    process.exit(1)
  }
  console.error(`Target: ${useEmulator ? 'local emulators' : 'REAL Firebase project'} (${projectId})`)
  initializeApp({ projectId })
  return getFirestore()
}
