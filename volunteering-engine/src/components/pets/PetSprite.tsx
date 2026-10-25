import { useState } from 'react'
import { useRecoloredSrc } from '../../hooks/useRecoloredSrc'
import { cn } from '../../lib/cn'
import { getPetSpecies, petSpriteUrl } from '../../lib/petVisuals'
import type { PetLook, PetStage } from '../../types/models'
import { PetAccessory } from './PetAccessory'

// Renders the species' sprite for the given stage, painted and dressed as the
// member has customised it. Falls back to the species emoji when the image is
// missing, so the app is usable before all sprite art is in place.
//
// It is `size` pixels square, or with `fill` it takes the size of its container.
export function PetSprite({
  species,
  stage,
  size = 80,
  fill = false,
  look,
  className = '',
}: {
  species: string
  stage: PetStage
  size?: number
  fill?: boolean
  look?: PetLook
  className?: string
}) {
  const url = petSpriteUrl(species, stage)
  const src = useRecoloredSrc(url, look?.color, species)
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const label = `${getPetSpecies(species).name}, stage ${stage + 1}`

  if (failedUrl === url) {
    return (
      <span
        role="img"
        aria-label={label}
        className={className}
        style={{ fontSize: size * 0.8, lineHeight: 1 }}
      >
        {getPetSpecies(species).fallbackEmoji}
      </span>
    )
  }

  return (
    <span
      className={cn('relative block shrink-0', fill && 'size-full', className)}
      style={fill ? undefined : { width: size, height: size }}
    >
      <img src={src} alt={label} className="size-full object-contain" onError={() => setFailedUrl(url)} />
      <PetAccessory species={species} stage={stage} accessory={look?.accessory} />
    </span>
  )
}
