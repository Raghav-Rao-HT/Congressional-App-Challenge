import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import type { Pet } from '../../types/models'

export function subscribeMyPets(uid: string, onChange: (pets: Pet[]) => void): () => void {
  return onSnapshot(collection(db, 'users', uid, 'pets'), (snapshot) => {
    onChange(snapshot.docs.map((d) => d.data() as Pet))
  })
}
