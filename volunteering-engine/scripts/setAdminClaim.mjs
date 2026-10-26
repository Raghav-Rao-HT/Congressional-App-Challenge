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

const profileRef = db.collection('users').doc(user.uid)
if ((await profileRef.get()).exists) {
  await profileRef.update({ accountType: 'admin' })
  console.log('Set accountType: admin on the existing Firestore users/{uid} profile (other fields kept)')
} else {
  const now = Date.now()
  await profileRef.set({
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
  })
  console.log('Created Firestore users/{uid} profile with accountType: admin')
}
process.exit(0)
