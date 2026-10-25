import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import type { Point } from '../islandLayout'
import type { IslandState, PetLook } from '../../types/models'

// One document holds a member's whole island: where each pet stands and how it
// is dressed. The security rules let only that member read or write it.
function islandRef(uid: string) {
  return doc(db, 'users', uid, 'island', 'state')
}

export function subscribeIslandState(
  uid: string,
  onChange: (state: IslandState) => void,
  onError: (error: Error) => void,
): () => void {
  return onSnapshot(
    islandRef(uid),
    (snapshot) => {
      const data = snapshot.data() as Partial<IslandState> | undefined
      onChange({ petPositions: data?.petPositions ?? {}, petLooks: data?.petLooks ?? {} })
    },
    onError,
  )
}

// `merge` writes only the one pet's entry, leaving the others as they are.
export async function savePetPosition(uid: string, species: string, point: Point): Promise<void> {
  await setDoc(islandRef(uid), { petPositions: { [species]: point } }, { merge: true })
}

export async function savePetLook(uid: string, species: string, look: PetLook): Promise<void> {
  await setDoc(islandRef(uid), { petLooks: { [species]: look } }, { merge: true })
}

// Sends every pet back to its default spot (looks are kept).
export async function clearPetPositions(uid: string): Promise<void> {
  await setDoc(islandRef(uid), { petPositions: {} }, { mergeFields: ['petPositions'] })
}
