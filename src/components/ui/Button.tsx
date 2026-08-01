import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  leftIcon?: ReactNode
  fullWidth?: boolean
}

const base =
  'pressable tap inline-flex items-center justify-center gap-2 rounded-[var(--radius-field)] font-bold ' +
  'disabled:opacity-45 disabled:pointer-events-none ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2'

const variants: Record<Variant, string> = {
  // Gradient + coloured lift: the CTA should feel raised off the page.
  primary: 'btn-primary-surface',
  secondary: 'bg-ink text-white elevate-2',
  outline: 'border border-[var(--color-primary)] bg-surface text-[var(--color-primary)] elevate-1',
  ghost: 'text-ink hover:bg-surface-2',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-[13px]',
  md: 'h-11 px-5 text-[15px]',
  lg: 'h-13 px-6 text-base',
}

/** Shared classes so a <Link> can be styled identically to a <Button>. */
export function buttonClasses(opts?: {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
  className?: string
}) {
  const { variant = 'primary', size = 'md', fullWidth, className } = opts ?? {}
  return cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className)
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  fullWidth,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={buttonClasses({ variant, size, fullWidth, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <span
          className={cn(
            'h-4 w-4 animate-spin rounded-full border-2 border-t-transparent',
            variant === 'primary' || variant === 'secondary'
              ? 'border-white/50 border-t-transparent'
              : 'border-[var(--color-primary)]/40 border-t-transparent',
          )}
          aria-hidden
        />
      ) : (
        leftIcon
      )}
      {children}
    </button>
  )
}
