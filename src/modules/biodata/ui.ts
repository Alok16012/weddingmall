/**
 * Local styling primitives.
 *
 * The module deliberately does not import the host app's `Button` or `cn` — its
 * only contract with the host is the design-token custom properties
 * (`--color-primary`, `--radius-field`, …) declared in the global stylesheet.
 * That is what lets the whole folder be copied into the Next.js site with one
 * route registration and no component rewiring.
 */

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ')
}

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-[var(--radius-field)] font-bold ' +
  'transition-[transform,opacity,background-color] duration-150 active:scale-[0.985] ' +
  'disabled:pointer-events-none disabled:opacity-45 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2'

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-[var(--color-primary)] text-white shadow-[0_6px_16px_-6px_rgba(255,90,82,0.65)] hover:bg-[var(--color-primary-dark)]',
  secondary: 'bg-[var(--color-ink)] text-white',
  outline:
    'border border-[var(--color-primary)] bg-white text-[var(--color-primary)] hover:bg-[var(--color-surface-2)]',
  ghost: 'text-[var(--color-ink)] hover:bg-[var(--color-surface-2)]',
}

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-[13px]',
  md: 'h-11 px-5 text-[15px]',
  lg: 'h-12 px-6 text-[15px]',
}

export function btn(opts?: {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
  className?: string
}): string {
  const { variant = 'primary', size = 'md', fullWidth, className } = opts ?? {}
  return cx(BASE, VARIANTS[variant], SIZES[size], fullWidth && 'w-full', className)
}

/** Input / select / textarea shell, shared so every control lines up. */
export const CONTROL =
  'w-full rounded-[var(--radius-field)] border bg-white px-3 py-2.5 text-[15px] text-[var(--color-ink)] ' +
  'placeholder:text-[var(--color-muted)]/70 ' +
  'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/35 focus:border-[var(--color-primary)]'

export const CARD =
  'rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-4 shadow-[0_1px_2px_rgba(25,25,29,0.04)]'
