import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '../../lib/cn'

export function ImageViewer({ src, label, onClose }: { src: string; label: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className="fixed inset-0 z-50 grid place-items-center bg-fg/70 p-4 backdrop-blur-sm"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="relative max-h-full max-w-3xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute -right-2 -top-2 z-10 grid size-9 place-items-center rounded-full bg-surface text-fg shadow-lift transition hover:bg-surface-2"
        >
          <X className="size-5" aria-hidden />
        </button>
        <img src={src} alt={label} className="max-h-[85vh] max-w-full rounded-2xl bg-white object-contain shadow-lift" />
        <p className="mt-2 text-center text-sm font-medium text-white">{label}</p>
      </div>
    </div>
  )
}

export function ImageThumb({ src, label, className }: { src: string; label: string; className?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={`View ${label.toLowerCase()}`}
        className={cn(
          'group relative overflow-hidden rounded-xl border border-line bg-white shadow-sm transition hover:shadow-card',
          className,
        )}
      >
        <img src={src} alt={label} className="h-24 w-auto max-w-40 object-cover" />
        <span className="absolute inset-x-0 bottom-0 bg-fg/60 px-2 py-0.5 text-left text-[0.7rem] font-semibold text-white">
          {label}
        </span>
      </button>
      {open && <ImageViewer src={src} label={label} onClose={() => setOpen(false)} />}
    </>
  )
}
