import { Loader2 } from 'lucide-react'
import type { ComponentProps } from 'react'
import { Link } from 'react-router-dom'
import { buttonClasses, type ButtonSize, type ButtonVariant } from './buttonStyles'

type ButtonProps = ComponentProps<'button'> & {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

export function Button({ variant, size, loading, disabled, className, children, type = 'button', ...props }: ButtonProps) {
  return (
    <button type={type} disabled={disabled || loading} className={buttonClasses(variant, size, className)} {...props}>
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  )
}

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: ButtonSize }

export function ButtonLink({ variant, size, className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClasses(variant, size, className)} {...props} />
}
