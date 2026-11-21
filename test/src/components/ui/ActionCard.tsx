import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Card } from './Card'

export function ActionCard({
  to,
  icon: Icon,
  title,
  children,
}: {
  to: string
  icon: LucideIcon
  title: string
  children: ReactNode
}) {
  return (
    <Link to={to} className="group block rounded-card focus-visible:outline-offset-4">
      <Card interactive className="flex h-full items-start gap-4 p-5">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-info-soft text-info transition group-hover:bg-brand-600 group-hover:text-white">
          <Icon className="size-5" aria-hidden />
        </span>
        <span>
          <span className="block font-semibold text-fg">{title}</span>
          <span className="block text-sm text-muted">{children}</span>
        </span>
      </Card>
    </Link>
  )
}
