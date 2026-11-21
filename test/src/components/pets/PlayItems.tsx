import type { CSSProperties } from 'react'

type ItemProps = { className?: string; style?: CSSProperties }

export function YarnBall({ className, style }: ItemProps) {
  return (
    <svg viewBox="0 0 76 66" className={className} style={style} aria-hidden>
      <path d="M52 46 C63 50 70 57 62 61 C54 64 56 55 66 58" fill="none" stroke="#e8553a" strokeWidth="3" strokeLinecap="round" />
      <circle cx="32" cy="32" r="27" fill="#ff7a59" />
      <g fill="none" stroke="#ffb09b" strokeWidth="3.2" strokeLinecap="round" opacity="0.9">
        <path d="M9 23 C22 32 41 30 56 15" />
        <path d="M6 36 C21 45 43 43 59 28" />
        <path d="M12 49 C26 55 45 51 56 40" />
      </g>
      <g fill="none" stroke="#d9472b" strokeWidth="2.6" strokeLinecap="round" opacity="0.65">
        <path d="M20 7 C13 24 20 46 35 57" />
        <path d="M35 4 C29 22 33 46 45 57" />
      </g>
      <circle cx="23" cy="20" r="9" fill="#fff" opacity="0.2" />
    </svg>
  )
}

export function VetSnack({ className, style }: ItemProps) {
  return (
    <svg viewBox="0 0 84 52" className={className} style={style} aria-hidden>
      <g fill="#c9974a">
        <rect x="11" y="13" width="62" height="26" rx="9" />
        <circle cx="14" cy="13" r="10.5" />
        <circle cx="14" cy="39" r="10.5" />
        <circle cx="70" cy="13" r="10.5" />
        <circle cx="70" cy="39" r="10.5" />
      </g>
      <g fill="#f4d394">
        <rect x="12.5" y="14.5" width="59" height="23" rx="8" />
        <circle cx="14" cy="13" r="9" />
        <circle cx="14" cy="39" r="9" />
        <circle cx="70" cy="13" r="9" />
        <circle cx="70" cy="39" r="9" />
      </g>
      <path d="M18 10 C26 7 34 8 38 12" stroke="#fff" strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round" fill="none" />
      <circle cx="42" cy="26" r="11" fill="#fff" />
      <path d="M39 19 h6 v5 h5 v6 h-5 v5 h-6 v-5 h-5 v-6 h5 z" fill="#e03145" />
    </svg>
  )
}

export function Pillow({ className, style }: ItemProps) {
  return (
    <svg viewBox="0 0 130 78" className={className} style={style} aria-hidden>
      <path d="M12 14 C44 6 86 6 118 14 C125 33 125 45 118 64 C86 72 44 72 12 64 C5 45 5 33 12 14 Z" fill="#b9a8ff" />
      <path d="M12 64 C44 72 86 72 118 64 C124 53 125 50 121 45 C90 56 40 56 9 45 C5 50 6 53 12 64 Z" fill="#8c7be0" opacity="0.7" />
      <path d="M22 19 C50 13 80 13 108 19" stroke="#e7e0ff" strokeWidth="4.5" strokeLinecap="round" fill="none" />
      <path d="M18 38 C48 44 82 44 112 38" stroke="#fff" strokeOpacity="0.7" strokeWidth="2.2" strokeDasharray="4 4" fill="none" />
      <g fill="#ffd166">
        <circle cx="10" cy="14" r="5" />
        <circle cx="120" cy="14" r="5" />
        <circle cx="10" cy="64" r="5" />
        <circle cx="120" cy="64" r="5" />
      </g>
    </svg>
  )
}
