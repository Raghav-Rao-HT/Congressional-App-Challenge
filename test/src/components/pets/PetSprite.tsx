import { useState } from 'react'
import { useRecoloredSrc } from '../../hooks/useRecoloredSrc'
import { cn } from '../../lib/cn'
import { headAnchor } from '../../lib/petAccessories'
import { getColorScheme, isSpecialScheme } from '../../lib/petColors'
import { getPetSpecies, petSpriteUrl } from '../../lib/petVisuals'
import type { PetLook, PetStage } from '../../types/models'
import { PetAccessory } from './PetAccessory'

function sparklePlaces(species: string, stage: number) {
  const anchor = headAnchor(species, stage)
  if (!anchor) return []
  const { hat, hand } = anchor
  return [
    { x: hat.x + hat.width * 0.55, y: hat.y + hat.width * 0.2, size: 16, delay: 0 },
    { x: hat.x - hat.width * 0.45, y: hat.y + hat.width * 0.5, size: 12, delay: 0.5 },
    { x: hat.x + hat.width * 0.15, y: hat.y - hat.width * 0.6, size: 11, delay: 1.1 },
    { x: hand.x - 150, y: hand.y - 60, size: 13, delay: 1.6 },
    { x: hand.x + 40, y: hand.y - 120, size: 10, delay: 0.9 },
  ]
}

export function PetSprite({
  species,
  stage,
  size = 80,
  fill = false,
  look,
  asleep = false,
  name,
  className = '',
}: {
  species: string
  stage: PetStage
  size?: number
  fill?: boolean
  look?: PetLook
  asleep?: boolean
  name?: string
  className?: string
}) {
  const url = petSpriteUrl(species, stage, asleep)
  const src = useRecoloredSrc(url, look?.color, species)
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const label = `${name || look?.name || getPetSpecies(species).name}, stage ${stage + 1}`
  const scheme = getColorScheme(look?.color)
  const special = isSpecialScheme(scheme)

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
      className={cn('relative isolate block shrink-0', fill && 'size-full', className)}
      style={fill ? undefined : { width: size, height: size }}
    >
      <PetAccessory layer="back" species={species} stage={stage} accessory={look?.accessory} />
      <img
        src={src}
        alt={label}
        className={cn('relative z-[1] size-full object-contain', scheme?.finish.kind === 'rainbow' && 'pet-rainbow')}
        onError={() => setFailedUrl(url)}
      />
      {special && scheme?.finish.kind === 'metal' && (
        <span
          aria-hidden
          className="pet-shine pointer-events-none absolute inset-0 z-[2]"
          style={{ WebkitMaskImage: `url("${src}")`, maskImage: `url("${src}")` }}
        />
      )}
      <PetAccessory species={species} stage={stage} accessory={look?.accessory} held={look?.held} />
      {scheme?.sparkle && (
        <svg viewBox="0 0 512 512" className="pointer-events-none absolute inset-0 z-[4] size-full" aria-hidden>
          {sparklePlaces(species, stage).map(({ x, y, size: star, delay }) => (
            <path
              key={`${x}-${y}`}
              className="gem-twinkle"
              style={{ animationDelay: `${delay}s` }}
              d={`M${x} ${y - star} Q${x + star * 0.18} ${y - star * 0.18} ${x + star} ${y} Q${x + star * 0.18} ${y + star * 0.18} ${x} ${y + star} Q${x - star * 0.18} ${y + star * 0.18} ${x - star} ${y} Q${x - star * 0.18} ${y - star * 0.18} ${x} ${y - star} Z`}
              fill="#fff"
              stroke={scheme.sparkle}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          ))}
        </svg>
      )}
    </span>
  )
}
