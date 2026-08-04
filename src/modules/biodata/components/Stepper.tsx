import { SECTIONS } from '../types'
import { cx } from '../ui'

/**
 * Progress indicator. Steps already completed are tappable so someone can jump
 * back to fix one answer without walking the whole form again; steps ahead are
 * not, because they may be gated by validation on the current step.
 */
export function Stepper({ current, onJump }: { current: number; onJump: (step: number) => void }) {
  const pct = ((current + 1) / SECTIONS.length) * 100

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <p className="text-[13px] font-bold text-[var(--color-ink)]">
          Step {current + 1} of {SECTIONS.length}
        </p>
        <p className="text-[12px] text-[var(--color-muted)]">{SECTIONS[current]?.title}</p>
      </div>

      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-2)]"
        role="progressbar"
        aria-valuenow={current + 1}
        aria-valuemin={1}
        aria-valuemax={SECTIONS.length}
        aria-label="Biodata progress"
      >
        <div
          className="h-full rounded-full bg-[var(--color-primary)] transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-2.5 flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {SECTIONS.map((section, i) => {
          const done = i < current
          const active = i === current
          return (
            <button
              key={section.id}
              type="button"
              disabled={i > current}
              onClick={() => onJump(i)}
              aria-current={active ? 'step' : undefined}
              className={cx(
                'shrink-0 rounded-full px-3 py-1 text-[12px] font-semibold whitespace-nowrap transition-colors',
                active && 'bg-[var(--color-primary)] text-white',
                done && 'bg-[var(--color-surface-2)] text-[var(--color-ink)]',
                !active && !done && 'text-[var(--color-muted)]/70',
              )}
            >
              {section.title}
            </button>
          )
        })}
      </div>
    </div>
  )
}
