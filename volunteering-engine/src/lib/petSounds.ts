import type { Mood } from './petPlay'

export type PetEvent =
  | 'call'
  | 'step'
  | 'chomp'
  | 'happy'
  | 'snore'

const PITCH_SHIFT: Record<string, number> = {
  ruby: 5,
  bubblegum: 4,
  tangerine: 3,
  sunshine: 1.5,
  meadow: 0,
  lagoon: -1.5,
  sky: -3,
  grape: -5,
}

export function pitchBoostFor(colorId: string | null | undefined): number {
  return (colorId && PITCH_SHIFT[colorId]) || 0
}

type Wave = OscillatorType | 'noise'

interface Voice {
  type: Wave
  from: number
  to: number
  start: number
  length: number
  volume: number
  cutoff?: number
  cutoffTo?: number
  band?: number
  vibrato?: number
  tremolo?: number
}

const NOISE_BOOST = 3

const noiseBuffers = new WeakMap<BaseAudioContext, AudioBuffer>()

function noiseBuffer(ctx: BaseAudioContext): AudioBuffer {
  let buffer = noiseBuffers.get(ctx)
  if (!buffer) {
    buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
    const samples = buffer.getChannelData(0)
    for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1
    noiseBuffers.set(ctx, buffer)
  }
  return buffer
}

function playVoice(ctx: BaseAudioContext, out: AudioNode, voice: Voice, scale: number, at: number): number {
  const start = at + voice.start
  const end = start + voice.length

  const volume = voice.type === 'noise' ? voice.volume * NOISE_BOOST : voice.volume
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(volume, start + Math.min(0.02, voice.length / 4))
  gain.gain.exponentialRampToValueAtTime(0.0001, end)

  let source: AudioScheduledSourceNode
  let pitched: AudioParam | null = null
  if (voice.type === 'noise') {
    const noise = ctx.createBufferSource()
    noise.buffer = noiseBuffer(ctx)
    noise.loop = true
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.Q.value = voice.band ?? 1.2
    filter.frequency.setValueAtTime(voice.from * scale, start)
    filter.frequency.exponentialRampToValueAtTime(voice.to * scale, end)
    noise.connect(filter)
    filter.connect(gain)
    noise.start(start, Math.random() * 0.5)
    source = noise
  } else {
    const oscillator = ctx.createOscillator()
    oscillator.type = voice.type
    oscillator.frequency.setValueAtTime(voice.from * scale, start)
    oscillator.frequency.exponentialRampToValueAtTime(voice.to * scale, end)
    pitched = oscillator.frequency

    let output: AudioNode = oscillator
    if (voice.cutoff) {
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(voice.cutoff * scale, start)
      filter.frequency.exponentialRampToValueAtTime((voice.cutoffTo ?? voice.cutoff) * scale, end)
      oscillator.connect(filter)
      output = filter
    }
    output.connect(gain)
    oscillator.start(start)
    source = oscillator
  }

  if (voice.vibrato && pitched) {
    const lfo = ctx.createOscillator()
    const depth = ctx.createGain()
    lfo.frequency.value = voice.vibrato
    depth.gain.value = voice.from * scale * 0.03
    lfo.connect(depth)
    depth.connect(pitched)
    lfo.start(start)
    lfo.stop(end)
  }
  if (voice.tremolo) {
    const lfo = ctx.createOscillator()
    const depth = ctx.createGain()
    lfo.frequency.value = voice.tremolo
    depth.gain.value = voice.volume * 0.5
    lfo.connect(depth)
    depth.connect(gain.gain)
    lfo.start(start)
    lfo.stop(end)
  }

  gain.connect(out)
  source.stop(end)
  return end - at
}

const VOICES: Record<string, Record<PetEvent, Voice[]>> = {
  fox: {
    call: [
      { type: 'triangle', from: 900, to: 1500, start: 0, length: 0.1, volume: 0.28, cutoff: 5000 },
      { type: 'triangle', from: 1100, to: 1900, start: 0.15, length: 0.12, volume: 0.28, cutoff: 5500 },
    ],
    step: [
      { type: 'triangle', from: 1800, to: 900, start: 0, length: 0.035, volume: 0.12, cutoff: 4000 },
      { type: 'noise', from: 3500, to: 2500, start: 0, length: 0.03, volume: 0.07, band: 2 },
    ],
    chomp: [
      { type: 'noise', from: 2800, to: 1600, start: 0, length: 0.06, volume: 0.22, band: 1.5 },
      { type: 'triangle', from: 520, to: 320, start: 0, length: 0.07, volume: 0.16 },
    ],
    happy: [
      { type: 'triangle', from: 1000, to: 1700, start: 0, length: 0.12, volume: 0.26, vibrato: 18 },
      { type: 'triangle', from: 1300, to: 2100, start: 0.13, length: 0.12, volume: 0.26 },
      { type: 'triangle', from: 1500, to: 2400, start: 0.27, length: 0.2, volume: 0.24, vibrato: 22 },
    ],
    snore: [
      { type: 'sine', from: 520, to: 760, start: 0, length: 0.55, volume: 0.13, tremolo: 5 },
      { type: 'noise', from: 2200, to: 1500, start: 0, length: 0.55, volume: 0.05, band: 3 },
      { type: 'sine', from: 760, to: 430, start: 0.75, length: 0.6, volume: 0.12 },
      { type: 'noise', from: 1800, to: 1000, start: 0.75, length: 0.6, volume: 0.045, band: 3 },
    ],
  },
  gorilla: {
    call: [
      { type: 'sawtooth', from: 210, to: 170, start: 0, length: 0.26, volume: 0.3, cutoff: 700, cutoffTo: 500, vibrato: 7 },
      { type: 'sawtooth', from: 230, to: 160, start: 0.32, length: 0.34, volume: 0.32, cutoff: 750, cutoffTo: 450, vibrato: 7 },
      { type: 'sine', from: 95, to: 45, start: 0.72, length: 0.16, volume: 0.5 },
      { type: 'sine', from: 100, to: 48, start: 0.86, length: 0.16, volume: 0.5 },
    ],
    step: [
      { type: 'sine', from: 110, to: 55, start: 0, length: 0.13, volume: 0.45 },
      { type: 'noise', from: 400, to: 200, start: 0, length: 0.06, volume: 0.18, band: 1 },
    ],
    chomp: [
      { type: 'noise', from: 1000, to: 450, start: 0, length: 0.13, volume: 0.3, band: 0.9 },
      { type: 'sawtooth', from: 170, to: 110, start: 0, length: 0.1, volume: 0.14, cutoff: 500 },
    ],
    happy: [
      { type: 'sawtooth', from: 300, to: 400, start: 0, length: 0.14, volume: 0.24, cutoff: 900, vibrato: 8 },
      { type: 'sawtooth', from: 330, to: 430, start: 0.17, length: 0.14, volume: 0.24, cutoff: 900 },
      { type: 'sine', from: 100, to: 50, start: 0.42, length: 0.15, volume: 0.45 },
      { type: 'sine', from: 100, to: 50, start: 0.54, length: 0.15, volume: 0.45 },
    ],
    snore: [
      { type: 'sawtooth', from: 70, to: 110, start: 0, length: 0.6, volume: 0.22, cutoff: 240, tremolo: 12 },
      { type: 'sawtooth', from: 110, to: 62, start: 0.7, length: 0.8, volume: 0.28, cutoff: 260, tremolo: 14, vibrato: 6 },
      { type: 'noise', from: 250, to: 150, start: 0, length: 1.5, volume: 0.08, band: 0.8 },
    ],
  },
  dragon: {
    call: [
      { type: 'sawtooth', from: 150, to: 60, start: 0, length: 0.85, volume: 0.34, cutoff: 1400, cutoffTo: 250, vibrato: 11, tremolo: 28 },
      { type: 'square', from: 75, to: 38, start: 0.05, length: 0.8, volume: 0.18, cutoff: 500, cutoffTo: 150, tremolo: 22 },
    ],
    step: [
      { type: 'sine', from: 75, to: 32, start: 0, length: 0.2, volume: 0.55 },
      { type: 'noise', from: 250, to: 120, start: 0, length: 0.12, volume: 0.25, band: 0.7 },
      { type: 'square', from: 60, to: 35, start: 0.01, length: 0.12, volume: 0.1, cutoff: 200 },
    ],
    chomp: [
      { type: 'noise', from: 1400, to: 350, start: 0, length: 0.16, volume: 0.3, band: 0.8 },
      { type: 'sawtooth', from: 100, to: 65, start: 0, length: 0.15, volume: 0.18, cutoff: 500 },
    ],
    happy: [
      { type: 'sawtooth', from: 110, to: 170, start: 0, length: 0.5, volume: 0.22, cutoff: 600, tremolo: 26 },
      { type: 'noise', from: 500, to: 2600, start: 0.05, length: 0.4, volume: 0.18, band: 0.7 },
      { type: 'sawtooth', from: 170, to: 90, start: 0.45, length: 0.4, volume: 0.22, cutoff: 500, tremolo: 24 },
    ],
    snore: [
      { type: 'sawtooth', from: 52, to: 40, start: 0, length: 1.1, volume: 0.3, cutoff: 160, tremolo: 5, vibrato: 4 },
      { type: 'square', from: 40, to: 30, start: 0, length: 1.1, volume: 0.12, cutoff: 120 },
      { type: 'noise', from: 1600, to: 500, start: 0.85, length: 0.45, volume: 0.1, band: 1 },
    ],
  },
  fish: {
    call: [
      { type: 'sine', from: 320, to: 760, start: 0, length: 0.09, volume: 0.34 },
      { type: 'sine', from: 380, to: 900, start: 0.13, length: 0.09, volume: 0.32 },
      { type: 'sine', from: 280, to: 640, start: 0.27, length: 0.12, volume: 0.3 },
    ],
    step: [
      { type: 'noise', from: 1800, to: 3600, start: 0, length: 0.07, volume: 0.16, band: 1.5 },
      { type: 'sine', from: 480, to: 900, start: 0, length: 0.05, volume: 0.12 },
    ],
    chomp: [
      { type: 'sine', from: 400, to: 1300, start: 0, length: 0.05, volume: 0.3 },
      { type: 'sine', from: 450, to: 1500, start: 0.09, length: 0.05, volume: 0.26 },
    ],
    happy: [
      { type: 'sine', from: 350, to: 800, start: 0, length: 0.07, volume: 0.28 },
      { type: 'sine', from: 420, to: 950, start: 0.09, length: 0.07, volume: 0.28 },
      { type: 'sine', from: 500, to: 1100, start: 0.18, length: 0.07, volume: 0.28 },
      { type: 'sine', from: 600, to: 1300, start: 0.27, length: 0.07, volume: 0.28 },
      { type: 'sine', from: 700, to: 1600, start: 0.36, length: 0.12, volume: 0.28 },
    ],
    snore: [
      { type: 'sine', from: 200, to: 420, start: 0, length: 0.14, volume: 0.22 },
      { type: 'sine', from: 230, to: 480, start: 0.32, length: 0.14, volume: 0.2 },
      { type: 'sine', from: 260, to: 520, start: 0.62, length: 0.14, volume: 0.18 },
      { type: 'sine', from: 160, to: 170, start: 0, length: 1, volume: 0.05, tremolo: 4 },
    ],
  },
}

const ring = (base: number, start: number, length: number, volume: number): Voice[] =>
  [1, 2.76, 5.4, 8.93].map((ratio, i) => ({
    type: 'sine' as const,
    from: base * ratio,
    to: base * ratio,
    start,
    length: length / (1 + i * 0.5),
    volume: volume / (1 + i * 1.2),
  }))

const glass = (hz: number, start: number, length: number, volume: number): Voice[] => [
  { type: 'sine', from: hz, to: hz, start, length, volume },
  { type: 'sine', from: hz * 1.0046, to: hz * 1.0046, start, length, volume: volume * 0.7 },
]

const RAINBOW = [523.25, 587.33, 659.25, 698.46, 783.99, 880, 987.77, 1046.5]

const rainbowNote = (hz: number, start: number, length: number, volume: number): Voice[] => [
  { type: 'triangle', from: hz, to: hz, start, length, volume },
  { type: 'sine', from: hz * 2, to: hz * 2, start, length: length * 0.8, volume: volume * 0.4 },
]

const SPECIAL: Record<string, Record<PetEvent, Voice[] | ((count: number) => Voice[])>> = {
  silver: {
    call: [{ type: 'noise', from: 1500, to: 9000, start: 0, length: 0.22, volume: 0.22, band: 1.2 }, ...ring(1100, 0.08, 1.1, 0.16)],
    step: [
      { type: 'sine', from: 3200, to: 3200, start: 0, length: 0.09, volume: 0.14 },
      { type: 'sine', from: 4900, to: 4900, start: 0, length: 0.06, volume: 0.08 },
    ],
    chomp: [
      { type: 'sine', from: 1250, to: 1250, start: 0, length: 0.14, volume: 0.16 },
      { type: 'sine', from: 3450, to: 3450, start: 0, length: 0.1, volume: 0.1 },
      { type: 'noise', from: 4000, to: 2500, start: 0, length: 0.03, volume: 0.12, band: 2 },
      { type: 'sine', from: 1180, to: 1180, start: 0.13, length: 0.14, volume: 0.15 },
      { type: 'sine', from: 3300, to: 3300, start: 0.13, length: 0.1, volume: 0.09 },
    ],
    happy: [...ring(1568, 0, 0.7, 0.12), ...ring(1975, 0.11, 0.7, 0.12), ...ring(2349, 0.22, 0.9, 0.13)],
    snore: [
      { type: 'sine', from: 220, to: 220, start: 0, length: 1.4, volume: 0.12, tremolo: 3 },
      { type: 'sine', from: 607, to: 607, start: 0, length: 1.4, volume: 0.05 },
      { type: 'sine', from: 2093, to: 2093, start: 0.9, length: 0.6, volume: 0.06 },
    ],
  },
  gold: {
    call: [
      { type: 'square', from: 988, to: 988, start: 0, length: 0.07, volume: 0.15, cutoff: 6000 },
      { type: 'square', from: 1319, to: 1319, start: 0.07, length: 0.45, volume: 0.15, cutoff: 6000 },
      { type: 'sine', from: 2637, to: 2637, start: 0.08, length: 0.5, volume: 0.08 },
      { type: 'sine', from: 3951, to: 3951, start: 0.16, length: 0.5, volume: 0.05 },
      { type: 'sine', from: 4186, to: 4186, start: 0.25, length: 0.4, volume: 0.04 },
      { type: 'sine', from: 5274, to: 5274, start: 0.32, length: 0.35, volume: 0.035 },
    ],
    step: [
      { type: 'triangle', from: 2400, to: 2200, start: 0, length: 0.07, volume: 0.12 },
      { type: 'sine', from: 3600, to: 3600, start: 0.02, length: 0.05, volume: 0.07 },
    ],
    chomp: [
      { type: 'sine', from: 1976, to: 1976, start: 0, length: 0.1, volume: 0.18 },
      { type: 'sine', from: 2637, to: 2637, start: 0.09, length: 0.2, volume: 0.18 },
    ],
    happy: [
      { type: 'noise', from: 4000, to: 1500, start: 0, length: 0.04, volume: 0.18, band: 1.5 },
      { type: 'sine', from: 1568, to: 1568, start: 0.07, length: 1, volume: 0.2 },
      { type: 'sine', from: 3136, to: 3136, start: 0.07, length: 0.7, volume: 0.12 },
      { type: 'sine', from: 4704, to: 4704, start: 0.07, length: 0.5, volume: 0.08 },
      { type: 'sine', from: 3136, to: 3136, start: 0.35, length: 0.15, volume: 0.06 },
      { type: 'sine', from: 3520, to: 3520, start: 0.42, length: 0.15, volume: 0.06 },
      { type: 'sine', from: 3951, to: 3951, start: 0.49, length: 0.15, volume: 0.06 },
    ],
    snore: [
      { type: 'sine', from: 392, to: 392, start: 0, length: 1.2, volume: 0.1, tremolo: 4 },
      { type: 'sine', from: 784, to: 784, start: 0, length: 1.2, volume: 0.05 },
      { type: 'sine', from: 2637, to: 2637, start: 0.5, length: 0.5, volume: 0.05 },
      { type: 'sine', from: 3136, to: 3136, start: 1, length: 0.4, volume: 0.04 },
    ],
  },
  diamond: {
    call: [
      ...[2093, 2637, 3136, 4186, 5274].flatMap((hz, i) => glass(hz, i * 0.06, 0.9, 0.12)),
      { type: 'noise' as const, from: 8000, to: 12000, start: 0.1, length: 0.35, volume: 0.05, band: 3 },
    ],
    step: [
      { type: 'sine', from: 5200, to: 5200, start: 0, length: 0.06, volume: 0.1 },
      { type: 'sine', from: 6900, to: 6900, start: 0.015, length: 0.05, volume: 0.07 },
    ],
    chomp: [
      { type: 'noise', from: 6000, to: 9500, start: 0, length: 0.05, volume: 0.2, band: 1.5 },
      { type: 'sine', from: 3200, to: 3200, start: 0, length: 0.12, volume: 0.1 },
      { type: 'noise', from: 6500, to: 9000, start: 0.07, length: 0.05, volume: 0.18, band: 1.5 },
    ],
    happy: [
      { type: 'sine', from: 1500, to: 6000, start: 0, length: 0.35, volume: 0.1 },
      ...glass(3951, 0.3, 0.8, 0.12),
      ...glass(5274, 0.38, 0.8, 0.1),
      { type: 'noise' as const, from: 9000, to: 13000, start: 0.3, length: 0.5, volume: 0.05, band: 4 },
    ],
    snore: [
      { type: 'sine', from: 523, to: 523, start: 0, length: 1.5, volume: 0.08, tremolo: 5 },
      { type: 'sine', from: 527, to: 527, start: 0, length: 1.5, volume: 0.08 },
      { type: 'sine', from: 784, to: 784, start: 0, length: 1.5, volume: 0.06, tremolo: 3 },
      { type: 'sine', from: 3136, to: 3136, start: 0.7, length: 0.6, volume: 0.05 },
    ],
  },
  rainbow: {
    call: [
      ...RAINBOW.flatMap((hz, i) => rainbowNote(hz, i * 0.065, i === RAINBOW.length - 1 ? 0.9 : 0.28, 0.14)),
      { type: 'noise' as const, from: 7000, to: 11000, start: 0.45, length: 0.5, volume: 0.05, band: 3 },
    ],
    step: (count) => rainbowNote(RAINBOW[count % RAINBOW.length], 0, 0.16, 0.16),
    chomp: [...rainbowNote(659.25, 0, 0.09, 0.16), ...rainbowNote(783.99, 0.08, 0.14, 0.16)],
    happy: [
      ...[523.25, 659.25, 783.99, 1046.5, 1318.5, 1568, 2093].flatMap((hz, i) => rainbowNote(hz, i * 0.05, 0.35, 0.1)),
      ...[1046.5, 1318.5, 1568].map((hz) => ({ type: 'sine' as const, from: hz, to: hz, start: 0.4, length: 0.9, volume: 0.08 })),
    ],
    snore: [659.25, 523.25, 392, 329.63].flatMap((hz, i) => [
      { type: 'sine' as const, from: hz, to: hz, start: i * 0.35, length: 0.8, volume: 0.1 },
      { type: 'triangle' as const, from: hz * 2, to: hz * 2, start: i * 0.35, length: 0.5, volume: 0.03 },
    ]),
  },
}

const STEP_EVERY: Record<string, number> = { fox: 0.19, gorilla: 0.38, dragon: 0.38, fish: 0.19 }
const SPECIAL_STEP_EVERY = 0.19

export function stepIntervalFor(species: string, colorId: string | null | undefined): number {
  if (colorId && SPECIAL[colorId]) return SPECIAL_STEP_EVERY
  return STEP_EVERY[species] ?? 0.19
}

let stepCount = 0

export function scheduleSound(
  ctx: BaseAudioContext,
  species: string,
  colorId: string | null | undefined,
  event: PetEvent = 'call',
  at = 0,
): number {
  const special = colorId ? SPECIAL[colorId]?.[event] : undefined
  const voices = typeof special === 'function' ? special(stepCount++) : (special ?? (VOICES[species] ?? VOICES.fox)[event])
  const scale = special ? 1 : 2 ** (pitchBoostFor(colorId) / 12)

  const master = ctx.createGain()
  master.gain.value = special ? 1.3 : 0.8
  master.connect(ctx.destination)

  return Math.max(...voices.map((voice) => playVoice(ctx, master, voice, scale, at)))
}

let shared: AudioContext | null = null

function audioContext(): AudioContext | null {
  const Context = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Context) return null
  shared ??= new Context()
  if (shared.state === 'suspended') void shared.resume()
  return shared
}

export function unlockAudio(): void {
  try {
    audioContext()
  } catch (error) {
    console.error('Could not start the audio:', error)
  }
}

export function playPetSound(species: string, colorId: string | null | undefined, event: PetEvent = 'call'): void {
  try {
    const ctx = audioContext()
    if (ctx) scheduleSound(ctx, species, colorId, event, ctx.currentTime + 0.01)
  } catch (error) {
    console.error('Could not play the pet sound:', error)
  }
}

const CHOMP_EVERY = 0.3
const SNORE_EVERY = 3
const ARRIVE_GAP = 1.5

export function createPlaySounds(play: (event: PetEvent) => void, stepEvery: number) {
  let previous: Mood = 'idle'
  let clock = 0
  let lastArrived = -Infinity
  let untilNext = 0

  return {
    tick(mood: Mood, dt: number, item: string | null) {
      clock += dt
      if (mood !== previous) untilNext = 0
      const every = mood === 'walking' ? stepEvery : mood === 'eating' ? CHOMP_EVERY : mood === 'asleep' ? SNORE_EVERY : 0
      if (every > 0) {
        if (untilNext <= 0) {
          play(mood === 'walking' ? 'step' : mood === 'eating' ? 'chomp' : 'snore')
          untilNext += every
        }
        untilNext -= dt
      }
      if (previous === 'walking' && mood === 'idle' && item === 'yarn' && clock - lastArrived > ARRIVE_GAP) {
        lastArrived = clock
        play('happy')
      }
      previous = mood
    },
    finishedSnack() {
      play('happy')
    },
    itemOut(item: string) {
      if (item === 'yarn' || item === 'snack') play('call')
    },
  }
}
