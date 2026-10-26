import { Send } from 'lucide-react'
import { useState } from 'react'
import { sendReplyImage } from '../../lib/firestore/hourLogs'
import type { HourLog } from '../../types/models'
import { Button } from '../ui/Button'
import { ImagePicker } from './ImagePicker'
import { ImageThumb } from './ImageViewer'

export function ReplyImage({ log }: { log: HourLog }) {
  const [draft, setDraft] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function send() {
    if (!draft) return
    setSending(true)
    setError(null)
    try {
      await sendReplyImage(log.logId, draft)
      setDraft(null)
    } catch (err) {
      console.error('Could not send the image:', err)
      setError(
        (err as { code?: string }).code === 'permission-denied'
          ? 'Firestore refused this. The latest security rules must be deployed.'
          : 'Could not send the image. Try again.',
      )
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mt-5 rounded-2xl bg-surface-2/60 p-4">
      <p className="text-sm font-semibold text-fg">Send an image back to the student</p>
      {log.replyImageURL && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <ImageThumb src={log.replyImageURL} label="You sent this" />
          <p className="text-xs text-muted">
            Sent {log.replyAt ? new Date(log.replyAt).toLocaleString() : ''}. Sending another replaces it.
          </p>
        </div>
      )}
      <div className="mt-3">
        <ImagePicker
          label="Image to send"
          previewLabel="Ready to send"
          value={draft}
          onChange={setDraft}
          disabled={sending}
        />
      </div>
      {draft && (
        <Button className="mt-3" size="sm" loading={sending} onClick={send}>
          <Send className="size-4" aria-hidden />
          Send to student
        </Button>
      )}
      {error && (
        <p role="alert" className="mt-2 text-xs font-medium text-bad">
          {error}
        </p>
      )}
    </div>
  )
}
