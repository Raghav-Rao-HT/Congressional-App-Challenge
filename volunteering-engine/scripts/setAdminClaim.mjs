// Bootstraps a platform admin account: sets the Firebase Auth custom claim
// { admin: true } (the only thing Firestore security rules can trust to
// gate admin-only writes, like approving an organization) and upserts the
// matching Firestore users/{uid} profile with accountType: 'admin' (which
// drives client-side routing). Creates the Auth user first if it doesn't
// exist yet.
//
// Against the local emulator suite (the default — see FIREBASE_AUTH_EMULATOR_HOST
// and FIRESTORE_EMULATOR_HOST below):
//   node scripts/setAdminClaim.mjs admin@example.com password123 "Admin Name"
//
// Against a real Firebase project (how a site owner gets an admin account):
//   USE_EMULATOR=false GCLOUD_PROJECT=<your-project-id> \
//   GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json \
//   node scripts/setAdminClaim.mjs owner@yourdomain.org "<password>" "Owner Name"
// If the email already has an account the existing user is promoted and the
// password argument is ignored. The person must sign out and back in once
// for the new claim to take effect. The service-account key is a secret:
// keep it outside the repo.

import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

const useEmulator = process.env.USE_EMULATOR !== 'false'
if (useEmulator) {
  process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099'
  process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080'
}

const [, , email, password, displayName] = process.argv
if (!email || !password || !displayName) {
  console.error('Usage: node scripts/setAdminClaim.mjs <email> <password> "<display name>"')
  process.exit(1)
}

// Against a real project the target must be named explicitly, so an
// admin is never created in the wrong project by accident.
const projectId = process.env.GCLOUD_PROJECT ?? (useEmulator ? 'demo-volunteering-engine' : undefined)
if (!projectId) {
  console.error('Set GCLOUD_PROJECT=<your-project-id> when USE_EMULATOR=false.')
  process.exit(1)
}
console.log(`Target: ${useEmulator ? 'local emulators' : 'REAL Firebase project'} (${projectId})`)

initializeApp({ projectId })
const auth = getAuth()
const db = getFirestore()

let user
try {
  user = await auth.getUserByEmail(email)
  console.log(`Found existing user ${user.uid}`)
} catch {
  user = await auth.createUser({ email, password, displayName })
  console.log(`Created new user ${user.uid}`)
}

await auth.setCustomUserClaims(user.uid, { admin: true })
console.log('Set custom claim { admin: true }')

const now = Date.now()
await db
  .collection('users')
  .doc(user.uid)
  .set(
    {
      uid: user.uid,
      email,
      displayName,
      homeState: 'N/A',
      accountType: 'admin',
      orgId: null,
      totalPoints: 0,
      totalHoursApproved: 0,
      currentStreakWeeks: 0,
      longestStreakWeeks: 0,
      lastServiceDate: null,
      createdAt: now,
      lastActiveAt: now,
    },
    { merge: true },
  )
console.log('Upserted Firestore users/{uid} profile with accountType: admin')
process.exit(0)
