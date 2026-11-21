import { collectionGroup, doc, getDoc, onSnapshot, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'
import { generateCode } from '../codes'
import type { UserContact } from '../../types/models'

const MAX_CODE_ATTEMPTS = 4

export function contactRef(uid: string) {
  return doc(db, 'users', uid, 'private', 'contact')
}

/**
 * Write the user's private contact document and claim their friend code, atomically with `extra` (the
 * signup path passes the profile write so the three documents commit together or not at all).
 * A code collision makes the batch fail; retry with a fresh code.
 */
export async function createContactAndFriendCode(
  params: { uid: string; email: string; displayName: string },
  addToBatch?: (batch: ReturnType<typeof writeBatch>) => void,
): Promise<UserContact> {
  let lastError: unknown
  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
    const friendCode = generateCode()
    const batch = writeBatch(db)
    addToBatch?.(batch)
    batch.set(contactRef(params.uid), { email: params.email, friendCode } satisfies UserContact)
    batch.set(doc(db, 'friendCodes', friendCode), { uid: params.uid, displayName: params.displayName })
    try {
      await batch.commit()
      return { email: params.email, friendCode }
    } catch (error) {
      lastError = error
    }
  }
  throw lastError
}

/**
 * Read the signed-in user's contact document, creating it (and their friend code) the first time. Accounts
 * that predate the privacy split have neither.
 */
export async function ensureMyContact(params: { uid: string; email: string; displayName: string }): Promise<UserContact> {
  const snapshot = await getDoc(contactRef(params.uid))
  if (snapshot.exists()) return snapshot.data() as UserContact
  return createContactAndFriendCode(params)
}

/** Admin-only: every user's contact document, keyed by uid. */
export function subscribeAllContacts(
  onChange: (contacts: Map<string, UserContact>) => void,
  onError: (error: Error) => void,
): () => void {
  return onSnapshot(
    collectionGroup(db, 'private'),
    (snapshot) => {
      const contacts = new Map<string, UserContact>()
      snapshot.docs.forEach((d) => {
        const uid = d.ref.parent.parent?.id
        if (d.id === 'contact' && uid) contacts.set(uid, d.data() as UserContact)
      })
      onChange(contacts)
    },
    onError,
  )
}
