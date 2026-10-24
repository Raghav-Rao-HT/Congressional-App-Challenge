import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthProvider'
import { subscribeMyPets } from '../lib/firestore/pets'
import { PET_SPECIES } from '../lib/petVisuals'
import { deriveStage } from '../lib/points'
import type { Pet } from '../types/models'

// Every pet species the member can choose from, with their saved hours.
// Species they haven't given hours to yet appear at 0 hours (the starting
// sprite), since a pet's doc is only created on its first approved hours.
export function useMyPets(): Pet[] {
  const { user } = useAuth()
  const [saved, setSaved] = useState<Pet[]>([])

  useEffect(() => {
    if (!user) return
    return subscribeMyPets(user.uid, setSaved)
  }, [user])

  return useMemo(
    () =>
      PET_SPECIES.map((species) => {
        const existing = saved.find((p) => p.species === species.id)
        return (
          existing ?? {
            species: species.id,
            name: species.name,
            xp: 0,
            stage: deriveStage(0),
            unlockedCosmetics: [],
            lastGrownAt: null,
          }
        )
      }),
    [saved],
  )
}
