import { useEffect, useState } from 'react'
import { getColorScheme, recolorSprite } from '../lib/petColors'

// The sprite URL to show for a pet painted in `schemeId`: the original image
// until the recoloured one is ready (and whenever there is no scheme).
export function useRecoloredSrc(src: string, schemeId: string | null | undefined, species: string): string {
  const [done, setDone] = useState<{ key: string; url: string } | null>(null)
  const scheme = getColorScheme(schemeId)
  const key = `${src}|${scheme?.id ?? ''}`

  useEffect(() => {
    if (!scheme) return
    let cancelled = false
    recolorSprite(src, scheme.id, species)
      .then((url) => {
        if (!cancelled) setDone({ key, url })
      })
      .catch((error) => console.error('Could not recolour the pet:', error))
    return () => {
      cancelled = true
    }
  }, [src, scheme, species, key])

  return scheme && done?.key === key ? done.url : src
}
