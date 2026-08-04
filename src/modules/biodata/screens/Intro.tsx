import { TEMPLATES } from '../templates/props'
import type { BiodataDraft, TemplateId } from '../types'
import { btn } from '../ui'
import { TemplateStylePreview } from '../components/TemplateStylePreview'

/**
 * Landing step. Its job is to make the offer legible in one screen — free, no
 * sign-up, nothing uploaded — and then get out of the way.
 */

const POINTS = [
  {
    title: 'Free, no account needed',
    body: 'Fill the form, pick a design, download the PDF. Nothing to pay, nothing to sign up for.',
  },
  {
    title: 'Your details stay on your device',
    body: 'The draft is saved in this browser only. Your photo and contact details are never uploaded to us.',
  },
  {
    title: 'Print-ready A4 PDF',
    body: 'Sharp vector text that prints cleanly at home or at a print shop, and shares straight to WhatsApp.',
  },
]

function Check() {
  return (
    <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
      <path d="M4 12.5l5 5L20 6.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

interface IntroProps {
  hasDraft: boolean
  draft: BiodataDraft
  onStart: () => void
  onResume: () => void
  onDiscard: () => void
  onSelectTemplate: (template: TemplateId) => void
}

export function Intro({
  hasDraft,
  draft,
  onStart,
  onResume,
  onDiscard,
  onSelectTemplate,
}: IntroProps) {
  return (
    <div className="space-y-7">
      <header className="space-y-3">
        <span className="inline-flex items-center rounded-full bg-[var(--color-surface-2)] px-2.5 py-1 text-[11px] font-bold tracking-wide text-[var(--color-primary)] uppercase">
          Free tool
        </span>
        <h1 className="font-display text-[26px] leading-tight font-bold text-[var(--color-ink)] sm:text-[32px]">
          Marriage Biodata Maker
        </h1>
        <p className="max-w-prose text-[15px] leading-relaxed text-[var(--color-muted)]">
          Create a professional matrimonial biodata in a few minutes. Answer the questions, choose a
          design, and download a print-ready PDF you can share with families and matchmakers.
        </p>
      </header>

      {hasDraft ? (
        <div className="rounded-[var(--radius-card)] border border-[var(--color-primary)]/25 bg-[var(--color-surface-2)] p-4">
          <p className="text-[14px] font-semibold text-[var(--color-ink)]">
            You have a saved biodata on this device.
          </p>
          <p className="mt-1 text-[13px] text-[var(--color-muted)]">
            Pick up where you left off, or clear it and start fresh.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className={btn({ size: 'md' })} onClick={onResume}>
              Continue my biodata
            </button>
            <button type="button" className={btn({ variant: 'ghost', size: 'md' })} onClick={onDiscard}>
              Start over
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className={btn({ size: 'lg', fullWidth: true })} onClick={onStart}>
          Create Free Biodata
        </button>
      )}

      <ul className="space-y-3">
        {POINTS.map((p) => (
          <li key={p.title} className="flex gap-2.5">
            <Check />
            <div>
              <p className="text-[14px] font-semibold text-[var(--color-ink)]">{p.title}</p>
              <p className="text-[13px] leading-relaxed text-[var(--color-muted)]">{p.body}</p>
            </div>
          </li>
        ))}
      </ul>

      <section>
        <h2 className="mb-2.5 text-[14px] font-bold text-[var(--color-ink)]">
          {TEMPLATES.length} designs to choose from
        </h2>
        <div className="grid grid-cols-3 gap-2.5">
          {TEMPLATES.map((t) => {
            const selected = draft.template === t.id
            return (
              <button
                key={t.id}
                type="button"
                aria-label={`Select ${t.name} biodata format`}
                aria-pressed={selected}
                onClick={() => onSelectTemplate(t.id)}
                className={`relative overflow-hidden rounded-[var(--radius-field)] border bg-white text-left transition-[border-color,box-shadow,transform] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 ${
                  selected
                    ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20'
                    : 'border-[var(--color-line)] hover:border-[var(--color-primary)]/55'
                }`}
              >
                {selected ? (
                  <span className="absolute top-1.5 right-1.5 z-10 rounded-full bg-[var(--color-primary)] px-1.5 py-0.5 text-[9px] font-bold text-white">
                    Selected
                  </span>
                ) : null}
                <div
                  className="flex h-20 flex-col justify-center gap-1.5 px-2.5"
                  style={{ backgroundColor: t.swatch[1] }}
                  aria-hidden
                >
                  <span className="block h-1.5 w-9 rounded-full" style={{ backgroundColor: t.swatch[0] }} />
                  <span className="block h-1 w-full rounded-full bg-black/12" />
                  <span className="block h-1 w-4/5 rounded-full bg-black/10" />
                  <span className="block h-1 w-2/3 rounded-full bg-black/10" />
                </div>
                <p className="px-2 py-1.5 text-[11px] leading-tight font-semibold text-[var(--color-ink)]">
                  {t.name}
                </p>
                <span className="sr-only">{t.description}</span>
              </button>
            )
          })}
        </div>
        <TemplateStylePreview draft={draft} />
      </section>
    </div>
  )
}
