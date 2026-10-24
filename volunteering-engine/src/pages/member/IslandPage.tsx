import { useState } from 'react'
import { IslandScene } from '../../components/island/IslandScene'
import { Page, PageHeader } from '../../components/ui/Page'
import { Tabs } from '../../components/ui/Tabs'
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

      <IslandScene scene={scene} pets={pets} />
    </Page>
  )
}
