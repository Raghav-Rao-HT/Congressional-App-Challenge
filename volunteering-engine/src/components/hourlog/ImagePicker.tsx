import { Camera, ImagePlus, Loader2, X } from 'lucide-react'
import { useId, useRef, useState, type ChangeEvent } from 'react'
import { imageToDataUrl } from '../../lib/imageCompress'
import { Button } from '../ui/Button'
import { ImageThumb } from './ImageViewer'

export function ImagePicker({
  value,
  onChange,
  label,
  hint,
  previewLabel = 'Your scan',
  disabled,
}: {
  value: string | null
  onChange: (dataUrl: string | null) => void
  label: string
  hint?: string
  previewLabel?: string
  disabled?: boolean
}) {
  const id = useId()
  const cameraRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handle(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      onChange(await imageToDataUrl(file))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not use that picture.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div role="group" aria-labelledby={id}>
      <span id={id} className="mb-1.5 block text-sm font-medium text-fg">
        {label}
      </span>
      <div className="rounded-2xl border-2 border-dashed border-line bg-surface-2/50 p-3">
        <div className="flex flex-wrap items-center gap-3">
          {value && <ImageThumb src={value} label={previewLabel} />}
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" disabled={disabled || busy} onClick={() => cameraRef.current?.click()}>
              {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Camera className="size-4" aria-hidden />}
              Take a photo
            </Button>
            <Button type="button" variant="secondary" size="sm" disabled={disabled || busy} onClick={() => fileRef.current?.click()}>
              <ImagePlus className="size-4" aria-hidden />
              {value ? 'Choose another' : 'Upload an image'}
            </Button>
            {value && (
              <Button type="button" variant="ghost" size="sm" disabled={disabled || busy} onClick={() => onChange(null)}>
                <X className="size-4" aria-hidden />
                Remove
              </Button>
            )}
          </div>
        </div>
        {hint && !error && <p className="mt-2 text-xs text-muted">{hint}</p>}
        {error && (
          <p role="alert" className="mt-2 text-xs font-medium text-bad">
            {error}
          </p>
        )}
      </div>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handle} />
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handle} />
    </div>
  )
}
