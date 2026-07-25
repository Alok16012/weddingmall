import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  leftIcon?: ReactNode
  fullWidth?: boolean
}

const base =
  'tap inline-flex items-center justify-center gap-2 rounded-[var(--radius-pill)] font-semibold transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/60 focus-visible:ring-offset-2'

const variants: Record<Variant, string> = {
  primary: 'gradient-primary text-white shadow-[var(--shadow-card)]',
  secondary: 'bg-ink text-white',
  outline: 'border border-line bg-surface text-ink',
  ghost: 'text-ink hover:bg-surface-2',
}

const sizes: Record<Size, string> = {
  sm: 'h-10 px-4 text-sm',
  md: 'h-12 px-5 text-[15px]',
  lg: 'h-14 px-6 text-base',
}

/** Shared classes so a <Link> can be styled as a button (spec: real navigation, not toasts). */
export function buttonClasses(opts?: { variant?: Variant; size?: Size; fullWidth?: boolean; className?: string }) {
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
      className={cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
          aria-hidden
        />
      ) : (
        leftIcon
      )}
      {children}
    </button>
  )
}
