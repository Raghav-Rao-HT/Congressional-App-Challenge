import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthProvider'
import { subscribeIslandState } from '../lib/firestore/island'
import { subscribeMyPets } from '../lib/firestore/pets'
import { PET_SPECIES } from '../lib/petVisuals'
import { deriveStage } from '../lib/points'
import type { Pet } from '../types/models'

export function useMyPets(): Pet[] {
  const { user } = useAuth()
  const [saved, setSaved] = useState<Pet[]>([])
  const [names, setNames] = useState<Record<string, string | null | undefined>>({})

  useEffect(() => {
    if (!user) return
    return subscribeMyPets(user.uid, setSaved)
  }, [user])

  useEffect(() => {
    if (!user) return
    return subscribeIslandState(
      user.uid,
      (state) => setNames(Object.fromEntries(Object.entries(state.petLooks ?? {}).map(([species, look]) => [species, look.name]))),
      (error) => console.error('Could not load the names of your pets:', error),
    )
  }, [user])

  return useMemo(
    () =>
      PET_SPECIES.map((species) => {
        const existing = saved.find((p) => p.species === species.id)
        const pet = existing ?? {
          species: species.id,
          name: species.name,
          xp: 0,
          stage: deriveStage(0),
          unlockedCosmetics: [],
          lastGrownAt: null,
        }
        return { ...pet, name: names[species.id] || species.name }
      }),
    [saved, names],
  )
}
