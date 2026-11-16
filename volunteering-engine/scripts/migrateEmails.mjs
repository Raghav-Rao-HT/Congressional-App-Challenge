// One-off migration for the privacy split: move each user's email OUT of the world-readable profile
// (users/{uid}.email) and into the owner/admin-only contact document (users/{uid}/private/contact), and give
// every user a friend code (friendCodes/{code}).
//
//   node scripts/migrateEmails.mjs                       # DRY RUN against the local emulators: prints what it would do
//   USE_EMULATOR=false GCLOUD_PROJECT=<id> node scripts/migrateEmails.mjs            # DRY RUN against the real project
//   USE_EMULATOR=false GCLOUD_PROJECT=<id> node scripts/migrateEmails.mjs --apply    # actually write
//
// Safe to re-run: users that already have a contact document are left alone, and the email is only removed from the
// profile AFTER the contact document exists. Accounts whose profile has no email fall back to their Firebase Auth email.
//
// Run order for production: deploy the new client, run this with --apply, THEN deploy the new firestore.rules
// (the new rules refuse profile writes that carry an email, and stop other users listing profiles).

import { getAuth } from 'firebase-admin/auth'
import { FieldValue } from 'firebase-admin/firestore'
import { generateCode } from './_codes.mjs'
import { connectFirestore } from './_admin.mjs'

const apply = process.argv.includes('--apply')
const db = connectFirestore()
const auth = getAuth()

async function freeCode() {
  for (let i = 0; i < 10; i += 1) {
    const code = generateCode()
    if (!(await db.doc(`friendCodes/${code}`).get()).exists) return code
  }
  throw new Error('Could not find an unused friend code after 10 tries')
}

const users = await db.collection('users').get()
const stats = { alreadyDone: 0, migrated: 0, emailRemovedOnly: 0, noEmail: 0, codeRepaired: 0 }

for (const doc of users.docs) {
  const profile = doc.data()
  const contactRef = db.doc(`users/${doc.id}/private/contact`)
  const contact = await contactRef.get()

  if (contact.exists) {
    // Repair: a contact document whose friend code was never registered would make that user unfindable.
    const existingCode = contact.data().friendCode
    let repaired = false
    if (existingCode && !(await db.doc(`friendCodes/${existingCode}`).get()).exists) {
      console.log(`${doc.id}: ${apply ? 'registering' : 'would register'} the missing friendCodes/${existingCode} entry`)
      if (apply) await db.doc(`friendCodes/${existingCode}`).set({ uid: doc.id, displayName: profile.displayName ?? '' })
      stats.codeRepaired += 1
      repaired = true
    }
    if (profile.email !== undefined) {
      console.log(`${doc.id}: contact exists; ${apply ? 'removing' : 'would remove'} the leftover email from the profile`)
      if (apply) await doc.ref.update({ email: FieldValue.delete() })
      stats.emailRemovedOnly += 1
    } else if (!repaired) {
      stats.alreadyDone += 1
    }
    continue
  }

  let email = profile.email
  if (!email) {
    try {
      email = (await auth.getUser(doc.id)).email
    } catch {
      email = undefined
    }
  }
  if (!email) {
    console.warn(`${doc.id}: no email on the profile or in Firebase Auth -- skipped`)
    stats.noEmail += 1
    continue
  }

  const friendCode = await freeCode()
  console.log(`${doc.id}: ${apply ? 'migrating' : 'would migrate'} (friend code ${friendCode})`)
  if (apply) {
    const batch = db.batch()
    batch.set(contactRef, { email, friendCode })
    batch.set(db.doc(`friendCodes/${friendCode}`), { uid: doc.id, displayName: profile.displayName ?? '' })
    if (profile.email !== undefined) batch.update(doc.ref, { email: FieldValue.delete() })
    await batch.commit()
  }
  stats.migrated += 1
}

console.log(`\n${users.size} users: ${stats.migrated} migrated, ${stats.emailRemovedOnly} email removed, ${stats.alreadyDone} already done, ${stats.codeRepaired} friend codes repaired, ${stats.noEmail} skipped (no email).`)
if (!apply) console.log('This was a dry run. Re-run with --apply to write.')
process.exit(0)
