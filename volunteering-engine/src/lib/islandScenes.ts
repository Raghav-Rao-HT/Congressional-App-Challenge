export type SceneId = 'sky' | 'space' | 'ocean'

export const SCENES: { id: SceneId; label: string; background: string }[] = [
  {
    id: 'sky',
    label: 'Blue sky',
    background: 'linear-gradient(to bottom, #3aa7ff 0%, #8fd3ff 55%, #dff3ff 100%)',
  },
  {
    id: 'space',
    label: 'Galaxy',
    background: 'linear-gradient(to bottom, #12062e 0%, #2b0f5c 50%, #5a24a8 100%)',
  },
  {
    id: 'ocean',
    label: 'Ocean',
    background: 'linear-gradient(to bottom, #9fdcff 0%, #d9f2ff 53%, #1b86c4 53%, #0a4a82 100%)',
  },
]

export const DEFAULT_SCENE: SceneId = 'sky'

export function isSceneId(value: unknown): value is SceneId {
  return SCENES.some((scene) => scene.id === value)
}
