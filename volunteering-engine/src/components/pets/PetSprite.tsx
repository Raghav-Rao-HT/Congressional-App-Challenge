import { useState } from 'react'
import { getPetSpecies, petSpriteUrl } from '../../lib/petVisuals'
import type { PetStage } from '../../types/models'

// Renders the species' sprite for the given stage. Falls back to the
// species emoji when the image is missing, so the app is usable before all
// sprite art is in place.
export function PetSprite({
  species,
  stage,
  size = 80,
  className = '',
}: {
  species: string
  stage: PetStage
  size?: number
  className?: string
}) {
  const url = petSpriteUrl(species, stage)
  const [failedUrl, setFailedUrl] = useState<string | null>(null)

  if (failedUrl === url) {
    return (
      <span
        role="img"
        aria-label={`${getPetSpecies(species).name}, stage ${stage + 1}`}
        className={className}
        style={{ fontSize: size * 0.8, lineHeight: 1 }}
      >
        {getPetSpecies(species).fallbackEmoji}
      </span>
    )
  }

  return (
    <img
      src={url}
      alt={`${getPetSpecies(species).name}, stage ${stage + 1}`}
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain' }}
      onError={() => setFailedUrl(url)}
    />
  )
}
