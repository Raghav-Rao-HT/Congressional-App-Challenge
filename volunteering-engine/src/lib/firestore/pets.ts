import { collection, getDocs, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { DEFAULT_PET_ID } from '../petVisuals'
import type { Pet } from '../../types/models'

export function subscribeMyPets(uid: string, onChange: (pets: Pet[]) => void): () => void {
  return onSnapshot(collection(db, 'users', uid, 'pets'), (snapshot) => {
    onChange(snapshot.docs.map((d) => d.data() as Pet))
  })
}

export async function getPetToGrow(uid: string): Promise<string> {
  const snapshot = await getDocs(collection(db, 'users', uid, 'pets'))
  const pets = snapshot.docs.map((d) => d.data() as Pet)
  pets.sort((a, b) => (b.lastGrownAt ?? 0) - (a.lastGrownAt ?? 0))
  return pets[0]?.species ?? DEFAULT_PET_ID
}
