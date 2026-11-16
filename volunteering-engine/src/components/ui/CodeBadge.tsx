import { Check, Copy } from 'lucide-react'
import { useState } from 'react'
import { formatCode } from '../../lib/codes'
import { Button } from './Button'

/** An 8-character code, big and easy to read out loud, with a copy button. */
export function CodeBadge({ code, label }: { code: string; label: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(formatCode(code))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-info-soft px-4 py-3">
      <span className="min-w-0">
        <span className="block text-xs font-semibold uppercase tracking-wide text-muted">{label}</span>
        <span className="block font-mono text-2xl font-bold tracking-[0.2em] text-fg">{formatCode(code)}</span>
      </span>
      <Button size="sm" variant="secondary" onClick={copy} aria-label={`Copy ${label}`}>
        {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
        {copied ? 'Copied' : 'Copy'}
      </Button>
    </div>
  )
}
