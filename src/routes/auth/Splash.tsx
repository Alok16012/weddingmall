import { BlinksAICredit, LogoMark } from '@/components/Brand'

/** C-01 — app initialisation / session-restore screen. */
export default function Splash() {
  return (
    <div className="mx-auto flex min-h-[100svh] max-w-md flex-col items-center justify-center gap-6 bg-canvas px-8 text-center">
      <div className="anim-pop-in flex flex-col items-center gap-3">
        <LogoMark className="h-16 w-16" />
        <span className="font-display text-3xl font-semibold text-[var(--color-primary)]">WeddingMall</span>
        <p className="text-sm text-muted">India&apos;s Wedding Marketplace</p>
      </div>
      <div
        className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-primary)]/30 border-t-[var(--color-primary)]"
        role="status"
        aria-label="Loading"
      />
      <div className="absolute bottom-10">
        <BlinksAICredit />
      </div>
    </div>
  )
}
