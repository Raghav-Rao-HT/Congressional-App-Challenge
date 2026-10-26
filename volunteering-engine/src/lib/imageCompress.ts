export const MAX_IMAGE_CHARS = 160_000

const START_SIDE = 1400
const MIN_SIDE = 320

async function openImage(file: File): Promise<{ source: CanvasImageSource; width: number; height: number; close: () => void }> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
      return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() }
    } catch {
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    return { source: image, width: image.naturalWidth, height: image.naturalHeight, close: () => URL.revokeObjectURL(url) }
  } catch {
    URL.revokeObjectURL(url)
    throw new Error('That file could not be read as a picture. Try a JPEG or PNG.')
  }
}

export async function imageToDataUrl(file: File, maxChars = MAX_IMAGE_CHARS): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Choose a picture (an image file).')

  const image = await openImage(file)
  try {
    let side = START_SIDE
    let quality = 0.78
    while (side >= MIN_SIDE) {
      const scale = Math.min(1, side / Math.max(image.width, image.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(image.width * scale))
      canvas.height = Math.max(1, Math.round(image.height * scale))
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Your browser cannot process images.')
      context.fillStyle = '#fff'
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.drawImage(image.source, 0, 0, canvas.width, canvas.height)

      const url = canvas.toDataURL('image/jpeg', quality)
      if (url.length <= maxChars) return url

      if (quality > 0.46) quality -= 0.12
      else {
        side = Math.round(side * 0.8)
        quality = 0.7
      }
    }
    throw new Error('That picture is too detailed to attach. Try a closer or simpler photo.')
  } finally {
    image.close()
  }
}
