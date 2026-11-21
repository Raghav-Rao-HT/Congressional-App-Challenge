export function IceCream() {
  return (
    <g transform="translate(0 -12)">
      <path d="M-18 -26 L18 -26 L0 46 Z" fill="#e3a857" />
      <path d="M18 -26 L0 46 L6 -26 Z" fill="#c98a3a" opacity="0.7" />
      <g stroke="#b9792b" strokeWidth="1.8" strokeLinecap="round" opacity="0.8">
        <path d="M-12 -18 L9 20 M-6 -26 L14 -4 M-14 -6 L-1 24" />
        <path d="M12 -18 L-9 20 M6 -26 L-14 -4 M14 -6 L1 24" />
      </g>
      <path d="M-24 -26 C-26 -44 -14 -50 0 -50 C14 -50 26 -44 24 -26 C18 -20 14 -30 8 -22 C2 -18 -2 -30 -8 -22 C-14 -30 -18 -20 -24 -26 Z" fill="#ff8fb3" />
      <path d="M-24 -26 C-26 -44 -14 -50 0 -50 C-12 -42 -14 -34 -8 -22 C-14 -30 -18 -20 -24 -26 Z" fill="#e6648f" opacity="0.6" />
      <circle cx="0" cy="-66" r="20" fill="#9be7c4" />
      <path d="M-18 -72 C-12 -86 6 -88 16 -78 C8 -80 -8 -76 -18 -64 Z" fill="#c8f6e0" opacity="0.8" />
      <path d="M12 -52 C20 -60 22 -70 16 -80 C22 -66 20 -58 8 -50 Z" fill="#6cc9a0" opacity="0.7" />
      <g fill="#fff">
        <rect x="-10" y="-46" width="3.6" height="7" rx="1.8" transform="rotate(-24 -8 -42)" />
        <rect x="4" y="-44" width="3.6" height="7" rx="1.8" transform="rotate(20 6 -40)" />
        <rect x="-4" y="-34" width="3.6" height="7" rx="1.8" transform="rotate(70 -2 -30)" />
      </g>
      <path d="M2 -88 C4 -98 10 -102 16 -104" fill="none" stroke="#5b8a3c" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="1" cy="-84" r="6.5" fill="#e0314b" />
      <circle cx="-1" cy="-86" r="2" fill="#fff" opacity="0.7" />
    </g>
  )
}

export function Fan() {
  const radius = 70
  const spread = 72
  const pivot = { x: 0, y: 14 }
  const edge = (degrees: number) => {
    const angle = (degrees * Math.PI) / 180
    return { x: pivot.x + radius * Math.sin(angle), y: pivot.y - radius * Math.cos(angle) }
  }
  const pleats = 8
  const wedges = Array.from({ length: pleats }, (_, i) => {
    const a = edge(-spread + (2 * spread * i) / pleats)
    const b = edge(-spread + (2 * spread * (i + 1)) / pleats)
    return { a, b, fill: i % 2 === 0 ? '#ff8fa3' : '#ffc4cf' }
  })
  const left = edge(-spread)
  const right = edge(spread)
  return (
    <g>
      <path d={`M${pivot.x} ${pivot.y} L${pivot.x - 5} ${pivot.y + 40} Q${pivot.x} ${pivot.y + 46} ${pivot.x + 5} ${pivot.y + 40} Z`} fill="#b9792b" />
      {wedges.map(({ a, b, fill }) => (
        <path key={`${a.x}`} d={`M${pivot.x} ${pivot.y} L${a.x} ${a.y} L${b.x} ${b.y} Z`} fill={fill} />
      ))}
      <path d={`M${left.x} ${left.y} A${radius} ${radius} 0 0 1 ${right.x} ${right.y}`} fill="none" stroke="#e0456b" strokeWidth="5" strokeLinecap="round" />
      <path d={`M${pivot.x} ${pivot.y} L${left.x} ${left.y} M${pivot.x} ${pivot.y} L${right.x} ${right.y}`} stroke="#b9792b" strokeWidth="3.5" strokeLinecap="round" />
      <g fill="#fff" opacity="0.85">
        <circle cx="0" cy="-30" r="4" />
        <circle cx="-26" cy="-14" r="3" />
        <circle cx="26" cy="-14" r="3" />
        <circle cx="-12" cy="-44" r="2.6" />
        <circle cx="12" cy="-44" r="2.6" />
      </g>
      <circle cx={pivot.x} cy={pivot.y} r="5.5" fill="#8a5a22" />
      <circle cx={pivot.x - 1.5} cy={pivot.y - 1.5} r="1.8" fill="#e3a857" />
    </g>
  )
}

export function Pompom() {
  const colors = ['#ff4d6d', '#ffffff', '#ffd23f', '#ff4d6d', '#ffffff', '#ffd23f']
  const strands = Array.from({ length: 19 }, (_, i) => {
    const angle = ((-84 + i * 9.3) * Math.PI) / 180
    const reach = 54 + (i % 3) * 8
    const end = { x: reach * Math.sin(angle), y: -14 - reach * Math.cos(angle) }
    const bend = { x: end.x * 0.35 + (i % 2 ? 7 : -7), y: -14 - reach * 0.55 }
    return { d: `M0 -12 Q${bend.x.toFixed(1)} ${bend.y.toFixed(1)} ${end.x.toFixed(1)} ${end.y.toFixed(1)}`, color: colors[i % colors.length] }
  })
  return (
    <g>
      <rect x="-5" y="-18" width="10" height="64" rx="5" fill="#8a5a22" />
      <rect x="-5" y="-18" width="4" height="64" rx="2" fill="#b9792b" />
      <rect x="-7" y="-20" width="14" height="14" rx="4" fill="#e0314b" />
      {strands.map((strand, i) => (
        <path key={i} d={strand.d} fill="none" stroke={strand.color} strokeWidth="8" strokeLinecap="round" />
      ))}
      {strands.map((strand, i) => (
        <path key={`s${i}`} d={strand.d} fill="none" stroke="#000" strokeOpacity="0.07" strokeWidth="2" strokeLinecap="round" />
      ))}
      <circle cx="0" cy="-16" r="7" fill="#ffd23f" />
    </g>
  )
}

export function Bat() {
  return (
    <g>
      <path d="M-5 38 L-6 2 C-7 -18 -14 -32 -14 -60 C-14 -92 14 -92 14 -60 C14 -32 7 -18 6 2 L5 38 Z" fill="#dba765" />
      <path d="M5 38 L6 2 C7 -18 14 -32 14 -60 C14 -92 6 -94 3 -92 C7 -70 4 -30 0 2 L0 38 Z" fill="#b9833e" opacity="0.7" />
      <path d="M-9 -70 C-9 -52 -5 -34 -3 -12" fill="none" stroke="#fff" strokeOpacity="0.45" strokeWidth="3.2" strokeLinecap="round" />
      <rect x="-6.5" y="4" width="13" height="30" rx="2" fill="#2f3640" />
      <g stroke="#59616e" strokeWidth="1.8">
        <path d="M-6.5 10 L6.5 6 M-6.5 17 L6.5 13 M-6.5 24 L6.5 20 M-6.5 31 L6.5 27" />
      </g>
      <ellipse cx="0" cy="39" rx="9.5" ry="4.6" fill="#b9833e" />
      <rect x="-12" y="-62" width="24" height="4.5" fill="#e0314b" opacity="0.85" />
      <rect x="-12.5" y="-54" width="25" height="4.5" fill="#2f55d4" opacity="0.85" />
    </g>
  )
}

export function Guitar() {
  return (
    <g transform="translate(0 -28)">
      <rect x="-5.5" y="-76" width="11" height="80" rx="2" fill="#4a2f17" />
      <g stroke="#c9b48a" strokeWidth="1.4" opacity="0.85">
        <path d="M-5.5 -62 H5.5 M-5.5 -50 H5.5 M-5.5 -38 H5.5 M-5.5 -26 H5.5 M-5.5 -14 H5.5" />
      </g>
      <path d="M-8 -78 L8 -78 L10 -96 C10 -102 -10 -102 -10 -96 Z" fill="#8b5a2b" />
      <g fill="#e8dcc0">
        <circle cx="-11.5" cy="-96" r="2.8" />
        <circle cx="-11.5" cy="-86" r="2.8" />
        <circle cx="11.5" cy="-96" r="2.8" />
        <circle cx="11.5" cy="-86" r="2.8" />
      </g>
      <path d="M-24 -2 C-24 -14 -8 -12 -5 -4 L5 -4 C8 -12 24 -14 24 -2 C24 6 16 10 18 20 C20 30 36 34 36 50 C36 68 -36 68 -36 50 C-36 34 -20 30 -18 20 C-16 10 -24 6 -24 -2 Z" fill="#e8793a" />
      <path d="M-24 -2 C-24 6 -16 10 -18 20 C-20 30 -36 34 -36 50 C-36 68 -10 68 -6 66 C-24 60 -28 46 -22 32 C-18 20 -26 8 -24 -2 Z" fill="#b95a22" opacity="0.65" />
      <path d="M-24 -2 C-24 -14 -8 -12 -5 -4 L5 -4 C8 -12 24 -14 24 -2 C24 6 16 10 18 20 C20 30 36 34 36 50 C36 68 -36 68 -36 50 C-36 34 -20 30 -18 20 C-16 10 -24 6 -24 -2 Z" fill="none" stroke="#7a3d12" strokeWidth="3" />
      <circle cx="0" cy="26" r="9.5" fill="#2a1a0c" />
      <circle cx="0" cy="26" r="11.5" fill="none" stroke="#f3c35a" strokeWidth="2" />
      <rect x="-12" y="46" width="24" height="6" rx="3" fill="#4a2f17" />
      <path d="M-2.4 -76 V48 M0 -76 V48 M2.4 -76 V48" stroke="#f1ead6" strokeWidth="0.9" opacity="0.9" />
    </g>
  )
}

export function RubberDuck() {
  return (
    <g>
      <path d="M-36 -22 C-44 -34 -50 -38 -52 -46 C-42 -42 -34 -40 -26 -42 C-18 -52 -2 -52 6 -46 C20 -50 28 -40 30 -28 C30 -8 18 2 0 2 C-22 2 -34 -8 -36 -22 Z" fill="#ffd23f" />
      <path d="M-34 -14 C-30 -2 -14 4 2 3 C20 2 32 -8 31 -26 C28 -6 14 -2 -2 -2 C-20 -2 -30 -8 -34 -14 Z" fill="#f2b01e" opacity="0.8" />
      <circle cx="16" cy="-58" r="19" fill="#ffd23f" />
      <path d="M30 -64 C40 -66 48 -62 50 -56 C46 -50 36 -50 30 -52 Z" fill="#ff8a1f" />
      <path d="M30 -58 C38 -60 44 -59 49 -57 L46 -54 C40 -55 34 -55 30 -54 Z" fill="#d96a0a" opacity="0.7" />
      <circle cx="18" cy="-64" r="3.2" fill="#2a1a0c" />
      <circle cx="19" cy="-65" r="1" fill="#fff" />
      <path d="M-8 -30 C-2 -38 12 -36 16 -26 C10 -20 -4 -20 -8 -30 Z" fill="#f2b01e" />
      <path d="M-4 -30 C0 -35 8 -34 11 -29" fill="none" stroke="#fff" strokeOpacity="0.5" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M2 -72 C8 -78 18 -78 22 -74" fill="none" stroke="#fff" strokeOpacity="0.6" strokeWidth="3.4" strokeLinecap="round" />
    </g>
  )
}

export function Trophy() {
  return (
    <g>
      <path d="M-26 -56 C-44 -58 -46 -30 -22 -30" fill="none" stroke="#e8a91f" strokeWidth="6" strokeLinecap="round" />
      <path d="M26 -56 C44 -58 46 -30 22 -30" fill="none" stroke="#e8a91f" strokeWidth="6" strokeLinecap="round" />
      <path d="M-27 -80 L27 -80 C27 -46 16 -30 0 -28 C-16 -30 -27 -46 -27 -80 Z" fill="#f6c43c" />
      <path d="M-27 -80 L-12 -80 C-12 -50 -8 -36 0 -28 C-16 -30 -27 -46 -27 -80 Z" fill="#d79a1b" opacity="0.55" />
      <ellipse cx="0" cy="-80" rx="27" ry="5.5" fill="#ffe178" />
      <ellipse cx="0" cy="-80" rx="21" ry="3.2" fill="#d79a1b" opacity="0.55" />
      <path d="M0 -66 l3.6 7.4 8.1 1.1 -5.9 5.7 1.4 8.1 -7.2 -3.8 -7.2 3.8 1.4 -8.1 -5.9 -5.7 8.1 -1.1 z" fill="#fff" opacity="0.9" />
      <path d="M-18 -72 C-18 -56 -15 -46 -10 -40" fill="none" stroke="#fff" strokeOpacity="0.6" strokeWidth="3" strokeLinecap="round" />
      <rect x="-4.5" y="-28" width="9" height="30" fill="#e8a91f" />
      <ellipse cx="0" cy="-8" rx="9" ry="4.5" fill="#f6c43c" />
      <path d="M-14 2 L14 2 L18 10 L-18 10 Z" fill="#f6c43c" />
      <rect x="-24" y="10" width="48" height="12" rx="3" fill="#6b3f1d" />
      <rect x="-12" y="13.5" width="24" height="5" rx="1.5" fill="#f6c43c" />
    </g>
  )
}

function Sparkle({ x, y, size, delay }: { x: number; y: number; size: number; delay: number }) {
  return (
    <path
      className="gem-twinkle"
      style={{ animationDelay: `${delay}s` }}
      d={`M${x} ${y - size} Q${x + size * 0.18} ${y - size * 0.18} ${x + size} ${y} Q${x + size * 0.18} ${y + size * 0.18} ${x} ${y + size} Q${x - size * 0.18} ${y + size * 0.18} ${x - size} ${y} Q${x - size * 0.18} ${y - size * 0.18} ${x} ${y - size} Z`}
      fill="#fff"
    />
  )
}

export function Diamond() {
  return (
    <g>
      <path d="M-24 -62 L24 -62 L46 -34 L0 28 L-46 -34 Z" fill="#6cc4f5" />
      <path d="M-24 -62 L24 -62 L12 -34 L-12 -34 Z" fill="#d6f5ff" />
      <path d="M-24 -62 L-12 -34 L-46 -34 Z" fill="#a4e1ff" />
      <path d="M24 -62 L46 -34 L12 -34 Z" fill="#8fd3f8" />
      <path d="M-46 -34 L-12 -34 L0 28 Z" fill="#4aa3e0" />
      <path d="M-12 -34 L12 -34 L0 28 Z" fill="#8fdcff" />
      <path d="M12 -34 L46 -34 L0 28 Z" fill="#2f86cf" />
      <path d="M-24 -62 L24 -62 L46 -34 L0 28 L-46 -34 Z M-12 -34 L-24 -62 M12 -34 L24 -62 M-12 -34 L0 28 M12 -34 L0 28 M-46 -34 H46" fill="none" stroke="#fff" strokeOpacity="0.75" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M-18 -56 L-34 -36" stroke="#fff" strokeOpacity="0.8" strokeWidth="3" strokeLinecap="round" />
      <Sparkle x={-44} y={-70} size={10} delay={0} />
      <Sparkle x={42} y={-58} size={8} delay={0.7} />
      <Sparkle x={8} y={-82} size={6} delay={1.3} />
    </g>
  )
}
