import { Clock, MapPin, PawPrint, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

const HIGHLIGHTS: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Clock, title: 'Log your hours', body: 'Get them signed off by the organization and earn points.' },
  { icon: PawPrint, title: 'Grow your pets', body: 'Every hour you give helps a pet level up.' },
  { icon: MapPin, title: 'Find opportunities', body: 'Browse New Jersey organizations and events near you.' },
]

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 p-12 text-white lg:flex lg:flex-col lg:justify-center">
        <div aria-hidden className="absolute -right-24 -top-24 size-96 rounded-full bg-coral-400/30 blur-3xl" />
        <div aria-hidden className="absolute -bottom-32 -left-20 size-96 rounded-full bg-brand-400/30 blur-3xl" />
        <div className="relative max-w-md">
          <h2 className="text-balance text-4xl font-bold leading-tight tracking-tight">
            Volunteer. Grow. Celebrate.
          </h2>
          <p className="mt-4 text-lg text-white/80">
            The easy way to track the good you do and keep your community moving.
          </p>
          <ul className="mt-10 space-y-6">
            {HIGHLIGHTS.map(({ icon: Icon, title: heading, body }) => (
              <li key={heading} className="flex gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
                  <Icon className="size-5" aria-hidden />
                </span>
                <div>
                  <p className="font-semibold">{heading}</p>
                  <p className="text-sm text-white/75">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold tracking-tight text-fg">{title}</h1>
          <p className="mt-2 text-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <p className="mt-6 text-center text-sm text-muted">{footer}</p>
        </div>
      </div>
    </div>
  )
}
