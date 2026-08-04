import { useEffect, useRef } from 'react'
import { Field } from '../components/Field'
import { PhotoPicker } from '../components/PhotoPicker'
import { Stepper } from '../components/Stepper'
import { SECTIONS, ageFrom, fieldsOf } from '../types'
import { btn } from '../ui'
import type { UseBiodataDraft } from '../useBiodataDraft'

/**
 * The multi-step form.
 *
 * Only the current section is mounted, which keeps a 40-field form fast on a
 * mid-range phone and means the "Save & Continue" gate has one obvious meaning:
 * validate this step, then move on.
 */

function SaveState({ state }: { state: UseBiodataDraft['saveState'] }) {
  if (state === 'idle') return null

  const label =
    state === 'saving'
      ? 'Saving…'
      : state === 'saved'
        ? 'Saved on this device'
        : state === 'too-large'
          ? 'Saved without the photo — it was too large to store'
          : 'Could not save a draft in this browser'

  const tone =
    state === 'saved' || state === 'saving'
      ? 'text-[var(--color-muted)]'
      : 'text-amber-700'

  return (
    <p className={`text-[12px] ${tone}`} role="status" aria-live="polite">
      {label}
    </p>
  )
}

interface FormProps {
  state: UseBiodataDraft
  onBackToIntro: () => void
  onPreview: () => void
}

export function Form({ state, onBackToIntro, onPreview }: FormProps) {
  const { draft, errors, saveState, setField, toggleHidden, isHidden, setPhoto, setStep } = state

  const step = Math.min(Math.max(draft.step, 0), SECTIONS.length - 1)
  const section = SECTIONS[step]!
  const fields = fieldsOf(section.id)
  const isLast = step === SECTIONS.length - 1

  const topRef = useRef<HTMLDivElement>(null)

  // Scrolling the step heading into view matters most on a phone, where the
  // next step would otherwise open halfway down the previous one's fields.
  useEffect(() => {
    topRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [step])

  const goNext = () => {
    if (!state.validateSection(section.id)) return
    if (isLast) onPreview()
    else setStep(step + 1)
  }

  const goPrev = () => {
    if (step === 0) onBackToIntro()
    else setStep(step - 1)
  }

  const value = (key: (typeof fields)[number]['key']) =>
    key === 'age' ? (ageFrom(draft.values.dob) === null ? '' : `${ageFrom(draft.values.dob)} years`) : (draft.values[key] ?? '')

  return (
    <div className="space-y-5">
      <div ref={topRef} className="scroll-mt-4">
        <Stepper current={step} onJump={setStep} />
      </div>

      <header>
        <h1 className="font-display text-[20px] font-bold text-[var(--color-ink)]">{section.title}</h1>
        <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-muted)]">{section.blurb}</p>
      </header>

      {section.id === 'personal' ? (
        <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-4">
          <p className="mb-3 text-[13px] font-semibold text-[var(--color-ink)]">Photograph</p>
          <PhotoPicker photo={draft.photo} onChange={setPhoto} />
        </div>
      ) : null}

      {section.id === 'contact' ? (
        <p className="rounded-[var(--radius-field)] bg-[var(--color-surface-2)] px-3 py-2.5 text-[12px] leading-relaxed text-[var(--color-muted)]">
          Contact details are printed on your biodata, so share it only with people you trust. Use the
          Shown / Hidden switch on any field you would rather leave off the PDF.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.key} className={field.type === 'textarea' ? 'sm:col-span-2' : undefined}>
            <Field
              field={field}
              value={value(field.key)}
              error={errors[field.key]}
              hidden={isHidden(field.key)}
              onChange={(v) => setField(field.key, v)}
              onToggleHidden={() => toggleHidden(field.key)}
            />
          </div>
        ))}
      </div>

      {/*
        The host decides how much room to leave: an app with a fixed bottom bar
        sets `--biodata-sticky-offset` to its height, everything else gets 0.
      */}
      <div className="sticky bottom-[var(--biodata-sticky-offset,0px)] -mx-4 border-t border-[var(--color-line)] bg-[var(--color-canvas)]/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <button type="button" className={btn({ variant: 'ghost', size: 'md' })} onClick={goPrev}>
            {step === 0 ? 'Back' : 'Previous'}
          </button>
          <button type="button" className={btn({ size: 'md', className: 'flex-1' })} onClick={goNext}>
            {isLast ? 'Preview biodata' : 'Save & Continue'}
          </button>
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-3">
          <SaveState state={saveState} />
          {step > 0 && !isLast ? (
            <button
              type="button"
              className="text-[12px] font-semibold text-[var(--color-primary)]"
              onClick={onPreview}
            >
              Skip to preview
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
