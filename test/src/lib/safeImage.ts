/**
 * Every image in the app is stored inline as a data URL that the app itself produced (JPEG scans,
 * PNG signatures). Anything else in those fields -- notably an http(s) URL planted by a modified
 * client -- would make the viewer's browser contact a third party, leaking their IP and user agent.
 * Refuse to render it. firestore.rules enforces the same shape on write.
 */
const SAFE_IMAGE = /^data:image\/(jpeg|png);base64,[A-Za-z0-9+/=]+$/

export function isSafeImageSrc(src: unknown): src is string {
  return typeof src === 'string' && src.length <= 400_000 && SAFE_IMAGE.test(src)
}
