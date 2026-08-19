import mark from '@/assets/brand/weddingmall-mark.webp'
import blinksAi from '@/assets/brand/blinks-ai.png'
import { cn } from '@/lib/cn'
import { BRAND_NAME } from '@/config/company'

/**
 * The product name, in one place. Import this instead of typing the string so
 * the name can never drift between the header, the splash and the PDF footer.
 * Re-exported from the company config, which is the single source of truth for
 * every brand and contact fact.
 */
export { BRAND_NAME }

/**
 * Wedding Mall butterfly mark (gradient coral→saffron, matches primary
 * gradient). Cut from the official 1600px logo in `brand/`, with the white disc
 * keyed out — the transparency is what lets Home tint it white over the coral
 * header (`brightness-0 invert`) instead of stamping a white square there.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <img
      src={mark}
      alt={BRAND_NAME}
      className={cn('h-8 w-8 object-contain', className)}
      width={32}
      height={32}
    />
  )
}

/**
 * Brand wordmark — "Wedding Mall", the customer-facing name. The domain suffix
 * is deliberately absent: `.online` belongs to the URL and the legal entity, not
 * to the brand a couple reads in the header.
 *
 * `tracking-tight` + `whitespace-nowrap` keep it on one line beside the city
 * selector at 320px instead of wrapping or pushing it off the edge. Colour is
 * inherited (`currentColor`), so the same component works on the white splash
 * and on the coral gradient header.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('font-display whitespace-nowrap font-semibold tracking-tight', className)}>
      {BRAND_NAME}
    </span>
  )
}

/** Full lockup: mark + wordmark. */
export function Logo({ className, showWordmark = true }: { className?: string; showWordmark?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark />
      {showWordmark && <Wordmark className="text-xl text-[var(--color-primary)]" />}
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
