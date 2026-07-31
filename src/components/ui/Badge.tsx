import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Tone = 'neutral' | 'success' | 'coral' | 'saffron' | 'muted'

const tones: Record<Tone, string> = {
  neutral: 'bg-surface-2 text-ink-soft',
  success: 'bg-success-100 text-success',
  coral: 'bg-[var(--color-primary-100)] text-[var(--color-primary)]',
  saffron: 'bg-[var(--color-accent-100)] text-warning',
  muted: 'bg-ink/5 text-muted',
}

export function Badge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: Tone
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-[var(--radius-pill)] px-2.5 py-1 text-xs font-semibold',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
