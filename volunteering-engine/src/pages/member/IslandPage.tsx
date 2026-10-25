import { useState } from 'react'
import { IslandScene } from '../../components/island/IslandScene'
import { Button } from '../../components/ui/Button'
import { Page, PageHeader } from '../../components/ui/Page'
import { Tabs } from '../../components/ui/Tabs'
import { useIslandState } from '../../hooks/useIslandState'
import { useMyPets } from '../../hooks/useMyPets'
import { DEFAULT_SCENE, isSceneId, SCENES, type SceneId } from '../../lib/islandScenes'

const STORAGE_KEY = 'vetwork.islandScene'

// The chosen backdrop is a per-device preference, so it lives in the browser
// rather than on the member's profile. Storage can be blocked (private
// windows), in which case the choice just isn't remembered.
function readStoredScene(): SceneId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (isSceneId(stored)) return stored
  } catch {
    // fall through to the default
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
      // not remembered, see readStoredScene
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

      <IslandScene scene={scene} pets={pets} positions={positions} looks={looks} onMovePet={movePet} />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Drag a pet to move it around, or focus it and use the arrow keys. Pets stay on the island, and the ones
          lower down stand in front. Dress them up from the Pets page.
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
