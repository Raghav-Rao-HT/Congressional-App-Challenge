export type ColorFinish =
  | { kind: 'hue'; hue: number }
  | { kind: 'metal'; ramp: readonly RampStop[]; facets?: number }
  | { kind: 'rainbow' }

export type RampStop = readonly [position: number, hex: string]

export interface ColorScheme {
  id: string
  name: string
  swatch: string
  minHours: number
  finish: ColorFinish
  sparkle?: string
}

export const COLOR_SCHEMES: readonly ColorScheme[] = [
  { id: 'ruby', name: 'Ruby', swatch: '#e03145', minHours: 0, finish: { kind: 'hue', hue: 355 } },
  { id: 'tangerine', name: 'Tangerine', swatch: '#f2711c', minHours: 0, finish: { kind: 'hue', hue: 24 } },
  { id: 'sunshine', name: 'Sunshine', swatch: '#f5b81c', minHours: 0, finish: { kind: 'hue', hue: 46 } },
  { id: 'meadow', name: 'Meadow', swatch: '#37b24d', minHours: 0, finish: { kind: 'hue', hue: 125 } },
  { id: 'lagoon', name: 'Lagoon', swatch: '#12b5b0', minHours: 0, finish: { kind: 'hue', hue: 178 } },
  { id: 'sky', name: 'Sky', swatch: '#339af0', minHours: 0, finish: { kind: 'hue', hue: 210 } },
  { id: 'grape', name: 'Grape', swatch: '#7950f2', minHours: 0, finish: { kind: 'hue', hue: 268 } },
  { id: 'bubblegum', name: 'Bubblegum', swatch: '#e64fa2', minHours: 0, finish: { kind: 'hue', hue: 322 } },
  {
    id: 'silver',
    name: 'Silver',
    swatch: 'linear-gradient(135deg, #f4f6fa 0%, #9aa3b2 35%, #e9edf3 55%, #7d8696 100%)',
    minHours: 50,
    finish: {
      kind: 'metal',
      ramp: [
        [0, '#262b36'],
        [0.35, '#667186'],
        [0.62, '#a3acbc'],
        [0.85, '#dbe0e8'],
        [1, '#ffffff'],
      ],
    },
  },
  {
    id: 'gold',
    name: 'Gold',
    swatch: 'linear-gradient(135deg, #fff1a8 0%, #e9a916 38%, #fde58a 58%, #b9770e 100%)',
    minHours: 100,
    sparkle: '#e0a21a',
    finish: {
      kind: 'metal',
      ramp: [
        [0, '#51330a'],
        [0.3, '#b27518'],
        [0.6, '#efb12a'],
        [0.85, '#ffe58e'],
        [1, '#fffbe2'],
      ],
    },
  },
  {
    id: 'diamond',
    name: 'Diamond',
    swatch: 'conic-gradient(from 20deg, #ffffff, #9fe4ff, #5aa9ee, #d9f7ff, #c8b6ff, #ffffff)',
    minHours: 200,
    sparkle: '#4aa0e6',
    finish: {
      kind: 'metal',
      facets: 6,
      ramp: [
        [0, '#1b4a8c'],
        [0.3, '#4aa0e6'],
        [0.55, '#8fdcff'],
        [0.8, '#d6f5ff'],
        [1, '#ffffff'],
      ],
    },
  },
  {
    id: 'rainbow',
    name: 'Rainbow',
    swatch: 'conic-gradient(from 0deg, #ff3b3b, #ff9f1a, #ffe14a, #3ccf5a, #28b8ff, #6a5cff, #d84bff, #ff3b3b)',
    minHours: 400,
    sparkle: '#b24bff',
    finish: { kind: 'rainbow' },
  },
]

const MAIN_HUE: Record<string, number> = { fox: 20, gorilla: 42, dragon: 148, fish: 215 }

export function getColorScheme(id: string | null | undefined): ColorScheme | null {
  return COLOR_SCHEMES.find((scheme) => scheme.id === id) ?? null
}

export function isSpecialScheme(scheme: ColorScheme | null | undefined): boolean {
  return !!scheme && scheme.minHours > 0
}

const GREY_BELOW = 0.14

interface Hsl {
  hue: number
  saturation: number
  lightness: number
}

function toHsl(r: number, g: number, b: number): Hsl {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const lightness = (max + min) / 2
  const delta = max - min
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1))
  let hue = 0
  if (delta !== 0) {
    if (max === r) hue = ((g - b) / delta) % 6
    else if (max === g) hue = (b - r) / delta + 2
    else hue = (r - g) / delta + 4
    hue *= 60
  }
  return { hue, saturation, lightness }
}

function hexToRgb(hex: string): [number, number, number] {
  const value = parseInt(hex.slice(1), 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

function sampleRamp(stops: readonly (readonly [number, [number, number, number]])[], position: number): [number, number, number] {
  if (position <= stops[0][0]) return stops[0][1]
  for (let i = 1; i < stops.length; i++) {
    const [to, toColor] = stops[i]
    if (position <= to) {
      const [from, fromColor] = stops[i - 1]
      const mix = (position - from) / (to - from)
      return [
        fromColor[0] + (toColor[0] - fromColor[0]) * mix,
        fromColor[1] + (toColor[1] - fromColor[1]) * mix,
        fromColor[2] + (toColor[2] - fromColor[2]) * mix,
      ]
    }
  }
  return stops[stops.length - 1][1]
}

export function recolorPixels(pixels: Uint8ClampedArray, finish: ColorFinish, mainHue: number, width: number): void {
  const bounds = finish.kind === 'hue' ? null : opaqueBounds(pixels, width)
  const ramp = finish.kind === 'metal' ? finish.ramp.map(([at, hex]) => [at, hexToRgb(hex)] as const) : null

  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] === 0) continue

    const { hue, saturation, lightness } = toHsl(pixels[i] / 255, pixels[i + 1] / 255, pixels[i + 2] / 255)
    if (lightness < 0.06 || (lightness > 0.97 && finish.kind !== 'metal')) continue

    if (finish.kind === 'metal' && ramp && bounds) {
      const { across, down } = positionIn(bounds, i / 4, width)
      const diagonal = (across + down) / 2
      const tone = Math.min(1, Math.max(0, (lightness - 0.06) / 0.9))
      let level = 0.15 + 0.85 * tone ** 0.85
      level += 0.17 * Math.exp(-(((diagonal - 0.38) / 0.09) ** 2)) + 0.08 * Math.exp(-(((diagonal - 0.72) / 0.05) ** 2))
      level = Math.min(1, Math.max(0, level))
      if (finish.facets) level = (Math.min(finish.facets - 1, Math.floor(level * finish.facets)) + 0.5) / finish.facets
      const [r, g, b] = sampleRamp(ramp, level)
      pixels[i] = r
      pixels[i + 1] = g
      pixels[i + 2] = b
      continue
    }

    let nextHue: number
    let nextSaturation: number
    let nextLightness = lightness
    if (finish.kind === 'rainbow' && bounds) {
      const { across, down } = positionIn(bounds, i / 4, width)
      nextHue = across * 320 + down * 80
      nextSaturation = Math.max(saturation, 0.78)
      nextLightness = 0.3 + 0.45 * lightness
    } else if (finish.kind === 'hue') {
      if (saturation >= GREY_BELOW) {
        nextHue = hue + (finish.hue - mainHue)
        nextSaturation = saturation
      } else if (lightness < 0.9) {
        nextHue = finish.hue
        nextSaturation = 0.5
        nextLightness = Math.min(0.9, lightness * 1.1 + 0.04)
      } else {
        continue
      }
    } else {
      continue
    }

    const [nr, ng, nb] = hslToRgb(((nextHue % 360) + 360) % 360, nextSaturation, nextLightness)
    pixels[i] = nr
    pixels[i + 1] = ng
    pixels[i + 2] = nb
  }
}

interface Bounds {
  left: number
  right: number
  top: number
  bottom: number
}

function opaqueBounds(pixels: Uint8ClampedArray, width: number): Bounds {
  const bounds: Bounds = { left: width, right: 0, top: Infinity, bottom: 0 }
  for (let i = 3; i < pixels.length; i += 4) {
    if (pixels[i] === 0) continue
    const pixel = (i - 3) / 4
    const x = pixel % width
    const y = Math.floor(pixel / width)
    if (x < bounds.left) bounds.left = x
    if (x > bounds.right) bounds.right = x
    if (y < bounds.top) bounds.top = y
    if (y > bounds.bottom) bounds.bottom = y
  }
  return bounds
}

function positionIn(bounds: Bounds, pixel: number, width: number): { across: number; down: number } {
  const x = pixel % width
  const y = Math.floor(pixel / width)
  return {
    across: (x - bounds.left) / Math.max(1, bounds.right - bounds.left),
    down: (y - bounds.top) / Math.max(1, bounds.bottom - bounds.top),
  }
}

function hslToRgb(hue: number, saturation: number, lightness: number): [number, number, number] {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1))
  const m = lightness - chroma / 2
  let r = 0
  let g = 0
  let b = 0
  if (hue < 60) [r, g, b] = [chroma, x, 0]
  else if (hue < 120) [r, g, b] = [x, chroma, 0]
  else if (hue < 180) [r, g, b] = [0, chroma, x]
  else if (hue < 240) [r, g, b] = [0, x, chroma]
  else if (hue < 300) [r, g, b] = [x, 0, chroma]
  else [r, g, b] = [chroma, 0, x]
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)]
}

const recolored = new Map<string, Promise<string>>()

export function recolorSprite(src: string, schemeId: string, species: string): Promise<string> {
  const scheme = getColorScheme(schemeId)
  if (!scheme) return Promise.resolve(src)

  const key = `${src}|${scheme.id}`
  let result = recolored.get(key)
  if (!result) {
    result = new Promise<string>((resolve, reject) => {
      const image = new Image()
      image.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = image.naturalWidth
        canvas.height = image.naturalHeight
        const context = canvas.getContext('2d', { willReadFrequently: true })
        if (!context) return reject(new Error('Canvas is not available.'))
        context.drawImage(image, 0, 0)
        const data = context.getImageData(0, 0, canvas.width, canvas.height)
        recolorPixels(data.data, scheme.finish, MAIN_HUE[species] ?? 0, canvas.width)
        context.putImageData(data, 0, 0)
        resolve(canvas.toDataURL('image/png'))
      }
      image.onerror = () => reject(new Error(`Could not load ${src}`))
      image.src = src
    })
    result.catch(() => recolored.delete(key))
    recolored.set(key, result)
  }
  return result
}
