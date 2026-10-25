import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthProvider'
import { clearPetPositions, savePetLook, savePetPosition, subscribeIslandState } from '../lib/firestore/island'
import type { Point } from '../lib/islandLayout'
import type { PetLook } from '../types/models'

const NONE: Record<string, never> = {}

// The signed-in member's island: where each pet stands and how it is dressed,
// live from Firestore, with actions to change them. Firestore applies a write
// to the live data immediately, so the screen updates before the save finishes.
export function useIslandState() {
  const { user } = useAuth()
  const uid = user?.uid
  const [positions, setPositions] = useState<Record<string, Point>>(NONE)
  const [looks, setLooks] = useState<Record<string, PetLook>>(NONE)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!uid) return
    return subscribeIslandState(
      uid,
      (state) => {
        setPositions(state.petPositions)
        setLooks(state.petLooks ?? NONE)
      },
      (err) => {
        console.error('Could not load your island:', err)
        setError('Could not load your island layout.')
      },
    )
  }, [uid])

  // Runs a save and reports a failure (the live data then reverts on its own).
  const save = useCallback((write: Promise<void>, failure: string) => {
    setError(null)
    write.catch((err) => {
      console.error(failure, err)
      setError(failure)
    })
  }, [])

  const movePet = useCallback(
    (species: string, point: Point) => {
      if (uid) save(savePetPosition(uid, species, point), 'Could not save that spot. Try again.')
    },
    [uid, save],
  )

  const setLook = useCallback(
    (species: string, look: PetLook) => {
      if (uid) save(savePetLook(uid, species, look), 'Could not save your changes. Try again.')
    },
    [uid, save],
  )

  const resetPositions = useCallback(() => {
    if (uid) save(clearPetPositions(uid), 'Could not reset the layout. Try again.')
  }, [uid, save])

  return { positions, looks, error, movePet, setLook, resetPositions }
}
