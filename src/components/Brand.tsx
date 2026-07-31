import mark from '@/assets/brand/weddingmall-mark.webp'
import blinksAi from '@/assets/brand/blinks-ai.png'
import { cn } from '@/lib/cn'

/** WeddingMall butterfly mark (gradient coral→saffron, matches primary gradient). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <img
      src={mark}
      alt="WeddingMall"
      className={cn('h-8 w-8 object-contain', className)}
      width={32}
      height={32}
    />
  )
}

/** Full lockup: mark + wordmark. */
export function Logo({ className, showWordmark = true }: { className?: string; showWordmark?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark />
      {showWordmark && (
        <span className="font-display text-xl font-semibold text-[var(--color-primary)]">WeddingMall</span>
      )}
    </span>
  )
}

/**
 * "Crafted by Blinks AI" credit — the creator's mark (opaque white-on-black),
 * shown inside a dark pill so it always reads correctly on any surface.
 */
export function BlinksAICredit({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-ink px-3 py-1.5',
        className,
      )}
    >
      <span className="text-[11px] font-medium tracking-wide text-white/70">Crafted by</span>
      <img src={blinksAi} alt="Blinks AI" className="h-4 w-auto object-contain" height={16} />
    </span>
  )
}
