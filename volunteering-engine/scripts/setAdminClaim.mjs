import { createInterface } from 'node:readline'
import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { generateCode } from './_codes.mjs'

// Create (or promote) an admin account.
//
//   npm run set-admin -- <email> "<display name>"            create/promote; password from $ADMIN_PASSWORD or a hidden prompt
//   npm run set-admin -- --revoke <email>                    remove admin rights again
//
// Targets the LOCAL EMULATORS unless you opt in: USE_EMULATOR=false GCLOUD_PROJECT=<project-id>.
// The password is never accepted as a command-line argument: argv ends up in shell history and `ps`.

const useEmulator = process.env.USE_EMULATOR !== 'false'
if (useEmulator) {
  process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099'
  process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080'
}

const argv = process.argv.slice(2)
const revoke = argv[0] === '--revoke'
const [email, displayName] = revoke ? [argv[1]] : argv

function usage(message) {
  if (message) console.error(message)
  console.error('Usage: npm run set-admin -- <email> "<display name>"\n       npm run set-admin -- --revoke <email>')
  process.exit(1)
}

if (!email) usage()
if (!revoke && argv.length > 2) {
  usage('Refusing to take a password on the command line. Set ADMIN_PASSWORD or type it at the prompt instead.')
}

const projectId = process.env.GCLOUD_PROJECT ?? (useEmulator ? 'demo-volunteering-engine' : undefined)
if (!projectId) {
  console.error('Set GCLOUD_PROJECT=<your-project-id> when USE_EMULATOR=false.')
  process.exit(1)
}
console.log(`Target: ${useEmulator ? 'local emulators' : 'REAL Firebase project'} (${projectId})`)

function promptHidden(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true })
    let muted = false
    rl._writeToOutput = (text) => {
      if (!muted) rl.output.write(text)
    }
    rl.question(question, (answer) => {
      rl.close()
      process.stdout.write('\n')
      resolve(answer)
    })
    muted = true
  })
}

initializeApp({ projectId })
const auth = getAuth()
const db = getFirestore()

if (revoke) {
  const user = await auth.getUserByEmail(email)
  await auth.setCustomUserClaims(user.uid, { admin: false })
  const ref = db.collection('users').doc(user.uid)
  if ((await ref.get()).exists) await ref.update({ accountType: 'member' })
  console.log(`Revoked admin for ${email} (${user.uid}). Their next sign-in token will no longer carry the claim.`)
  process.exit(0)
}

let user
try {
  user = await auth.getUserByEmail(email)
  console.log(`Found existing user ${user.uid}`)
} catch {
  if (!displayName) usage('A display name is required when creating a new user.')
  const password = process.env.ADMIN_PASSWORD ?? (await promptHidden('Password for the new admin (min 10 chars): '))
  if (password.length < 10) usage('That password is too short (min 10 characters).')
  // Created by an operator, not through the sign-up form, so there is no inbox round-trip to wait for.
  user = await auth.createUser({ email, password, displayName, emailVerified: true })
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
    displayName: displayName ?? email,
    homeState: 'N/A',
    accountType: 'admin',
    ageBand: '18+',
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

// The email lives in the owner/admin-only contact document, never on the (widely readable) profile.
const contactRef = profileRef.collection('private').doc('contact')
if (!(await contactRef.get()).exists) {
  const friendCode = generateCode()
  const finalName = (await profileRef.get()).data()?.displayName ?? displayName ?? email
  await db.runTransaction(async (tx) => {
    tx.set(contactRef, { email, friendCode })
    tx.set(db.collection('friendCodes').doc(friendCode), { uid: user.uid, displayName: finalName })
  })
  console.log('Created users/{uid}/private/contact with the email and a friend code')
}
process.exit(0)
