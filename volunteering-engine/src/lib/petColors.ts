// Colour schemes a member can paint onto a pet from the easel. A scheme is a
// target hue; recolouring turns the pet's main colour into it.
export interface ColorScheme {
  id: string
  name: string
  // 0-360 on the colour wheel.
  hue: number
  // The paint colour shown on the easel.
  swatch: string
}

export const COLOR_SCHEMES: readonly ColorScheme[] = [
  { id: 'ruby', name: 'Ruby', hue: 355, swatch: '#e03145' },
  { id: 'tangerine', name: 'Tangerine', hue: 24, swatch: '#f2711c' },
  { id: 'sunshine', name: 'Sunshine', hue: 46, swatch: '#f5b81c' },
  { id: 'meadow', name: 'Meadow', hue: 125, swatch: '#37b24d' },
  { id: 'lagoon', name: 'Lagoon', hue: 178, swatch: '#12b5b0' },
  { id: 'sky', name: 'Sky', hue: 210, swatch: '#339af0' },
  { id: 'grape', name: 'Grape', hue: 268, swatch: '#7950f2' },
  { id: 'bubblegum', name: 'Bubblegum', hue: 322, swatch: '#e64fa2' },
]

// The hue each species' artwork is mainly drawn in. Recolouring rotates every
// colourful pixel by (target - this), so a pet with several colours (a green
// dragon with red wings and gold trim) keeps the same relationships between them.
const MAIN_HUE: Record<string, number> = { fox: 20, gorilla: 42, dragon: 148, fish: 215 }

export function getColorScheme(id: string | null | undefined): ColorScheme | null {
  return COLOR_SCHEMES.find((scheme) => scheme.id === id) ?? null
}

// Pixels with less saturation than this are grey rather than coloured.
const GREY_BELOW = 0.14

// Recolours sprite pixels in place (RGBA, as in canvas ImageData).
//  - coloured pixels: the hue is rotated toward the scheme, lightness kept
//  - grey/black fur (the gorilla): tinted with the scheme's hue
//  - near-white and near-black pixels, and transparent ones, are left alone
export function recolorPixels(pixels: Uint8ClampedArray, targetHue: number, mainHue: number): void {
  const shift = targetHue - mainHue
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] === 0) continue

    const r = pixels[i] / 255
    const g = pixels[i + 1] / 255
    const b = pixels[i + 2] / 255
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const lightness = (max + min) / 2
    if (lightness > 0.97 || lightness < 0.06) continue

    const delta = max - min
    const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1))
    let hue = 0
    if (delta !== 0) {
      if (max === r) hue = ((g - b) / delta) % 6
      else if (max === g) hue = (b - r) / delta + 2
      else hue = (r - g) / delta + 4
      hue *= 60
    }

    let nextHue: number
    let nextSaturation: number
    let nextLightness = lightness
    if (saturation >= GREY_BELOW) {
      nextHue = hue + shift
      nextSaturation = saturation
    } else if (lightness < 0.9) {
      // Grey fur has no hue to rotate, so give it the scheme's colour.
      nextHue = targetHue
      nextSaturation = 0.5
      nextLightness = Math.min(0.9, lightness * 1.1 + 0.04)
    } else {
      continue
    }

    const [nr, ng, nb] = hslToRgb(((nextHue % 360) + 360) % 360, nextSaturation, nextLightness)
    pixels[i] = nr
    pixels[i + 1] = ng
    pixels[i + 2] = nb
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

// The sprite at `src` painted in a scheme, as an image URL. Results are kept,
// so each sprite and colour is only processed once per visit.
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
        recolorPixels(data.data, scheme.hue, MAIN_HUE[species] ?? 0)
        context.putImageData(data, 0, 0)
        resolve(canvas.toDataURL('image/png'))
      }
      image.onerror = () => reject(new Error(`Could not load ${src}`))
      image.src = src
    })
    // A failed attempt shouldn't be remembered, so a later try can succeed.
    result.catch(() => recolored.delete(key))
    recolored.set(key, result)
  }
  return result
}
