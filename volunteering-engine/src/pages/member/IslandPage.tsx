import { useState } from 'react'
import { IslandScene } from '../../components/island/IslandScene'
import { Button } from '../../components/ui/Button'
import { Page, PageHeader } from '../../components/ui/Page'
import { Tabs } from '../../components/ui/Tabs'
import { useIslandState } from '../../hooks/useIslandState'
import { useMyPets } from '../../hooks/useMyPets'
import { DEFAULT_SCENE, isSceneId, SCENES, type SceneId } from '../../lib/islandScenes'
import { playPetSound } from '../../lib/petSounds'

const STORAGE_KEY = 'vetwork.islandScene'

function readStoredScene(): SceneId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (isSceneId(stored)) return stored
  } catch {
  }
  return DEFAULT_SCENE
}

export function IslandPage() {
  const pets = useMyPets()
  const { positions, looks, error, movePet, resetPositions } = useIslandState()
  const [scene, setScene] = useState<SceneId>(readStoredScene)

  function chooseScene(next: SceneId) {
    setScene(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
    }
  }

  return (
    <Page>
      <PageHeader
        title="Your island"
        description="Your pets, together on their own floating island."
        actions={
          <Tabs
            tabs={SCENES.map(({ id, label }) => ({ value: id, label }))}
            value={scene}
            onChange={chooseScene}
          />
        }
      />

      <IslandScene
        scene={scene}
        pets={pets}
        positions={positions}
        looks={looks}
        onMovePet={movePet}
        onClickPet={(species) => playPetSound(species, looks[species]?.color)}
      />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Click a pet to hear it (a painted pet's voice is pitched higher the closer its colour is to red, and lower the closer
          it is to purple; silver, gold, diamond and rainbow pets have sounds of their own). Drag a pet
          to move it around, or focus it and use the arrow keys. Pets stay on the island, and the ones lower down stand
          in front. Dress them up from the Pets page.
        </p>
        <Button variant="ghost" size="sm" onClick={resetPositions}>
          Reset positions
        </Button>
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-bad-soft px-4 py-3 text-sm font-medium text-bad">
          {error}
        </p>
      )}
    </Page>
  )
}
