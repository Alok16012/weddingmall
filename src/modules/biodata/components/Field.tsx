import { useId } from 'react'
import { CONTROL, cx } from '../ui'
import type { FieldDef } from '../types'

/**
 * One form control.
 *
 * Every field carries its own "show on biodata" switch. Hiding is a print-time
 * decision, not a delete: the value stays in the draft so the user can bring it
 * back, but `printRows` skips it, so no template can leak it. That is how the
 * "don't expose private information" requirement is enforced in one place
 * rather than three.
 */

interface FieldProps {
  field: FieldDef
  value: string
  error?: string
  hidden: boolean
  onChange: (value: string) => void
  onToggleHidden: () => void
}

function EyeOff() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M3 3l18 18" strokeLinecap="round" />
      <path d="M10.6 10.6a2 2 0 002.8 2.8" strokeLinecap="round" />
      <path d="M9.4 5.3A9.6 9.6 0 0112 5c5 0 9 4.5 9 7a11 11 0 01-2.4 3.6M6.2 6.7C3.9 8.2 3 10.3 3 12c0 2.5 4 7 9 7a9.4 9.4 0 003.7-.8" strokeLinecap="round" />
    </svg>
  )
}

function Eye() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M3 12c0-2.5 4-7 9-7s9 4.5 9 7-4 7-9 7-9-4.5-9-7z" />
      <circle cx="12" cy="12" r="2.4" />
    </svg>
  )
}

export function Field({ field, value, error, hidden, onChange, onToggleHidden }: FieldProps) {
  const id = useId()
  const describedBy = error ? `${id}-err` : field.hint ? `${id}-hint` : undefined
  const border = error ? 'border-red-500' : 'border-[var(--color-line)]'

  const shared = {
    id,
    value,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy,
    onChange: (e: { target: { value: string } }) => onChange(e.target.value),
  }

  return (
    <div className={cx(hidden && 'opacity-60')}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-[13px] font-semibold text-[var(--color-ink)]">
          {field.label}
          {field.required ? (
            <span className="ml-1 text-[var(--color-primary)]" aria-hidden>
              *
            </span>
          ) : (
            <span className="ml-1.5 text-[11px] font-medium text-[var(--color-muted)]">Optional</span>
          )}
        </label>

        <button
          type="button"
          onClick={onToggleHidden}
          aria-pressed={hidden}
          title={hidden ? `Show ${field.label} on the biodata` : `Hide ${field.label} from the biodata`}
          className={cx(
            'inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold transition-colors',
            hidden
              ? 'bg-[var(--color-surface-2)] text-[var(--color-muted)]'
              : 'text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]',
          )}
        >
          {hidden ? <EyeOff /> : <Eye />}
          <span>{hidden ? 'Hidden' : 'Shown'}</span>
        </button>
      </div>

      {field.computed ? (
        <div
          className={cx(
            CONTROL,
            'border-[var(--color-line)] bg-[var(--color-surface-2)] text-[var(--color-muted)]',
          )}
        >
          {value || '—'}
        </div>
      ) : field.type === 'select' ? (
        <select {...shared} className={cx(CONTROL, border, 'appearance-none pr-9')}>
          <option value="">Select…</option>
          {field.options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : field.type === 'textarea' ? (
        <textarea
          {...shared}
          rows={4}
          placeholder={field.placeholder}
          className={cx(CONTROL, border, 'resize-y leading-relaxed')}
        />
      ) : (
        <input
          {...shared}
          type={field.type === 'tel' ? 'tel' : field.type === 'email' ? 'email' : field.type}
          inputMode={field.type === 'tel' ? 'tel' : undefined}
          autoComplete={field.type === 'email' ? 'email' : 'off'}
          placeholder={field.placeholder}
          className={cx(CONTROL, border)}
        />
      )}

      {error ? (
        <p id={`${id}-err`} className="mt-1 text-[12px] font-medium text-red-600">
          {error}
        </p>
      ) : field.hint ? (
        <p id={`${id}-hint`} className="mt-1 text-[12px] text-[var(--color-muted)]">
          {field.hint}
        </p>
      ) : null}
    </div>
  )
}
