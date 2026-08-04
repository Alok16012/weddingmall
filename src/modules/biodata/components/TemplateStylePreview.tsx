import { TEMPLATES } from '../templates/props'
import { formatDob, type BiodataDraft } from '../types'

interface PreviewRow {
  label: string
  value: string
}

function Portrait({ photo, className }: { photo: string | null; className: string }) {
  if (photo) {
    return <img src={photo} alt="" className={`${className} object-cover`} />
  }

  return (
    <div className={`${className} flex flex-col items-center justify-center overflow-hidden bg-[#eee8e4]`} aria-hidden>
      <span className="h-3.5 w-3.5 rounded-full bg-[#c8bdb7]" />
      <span className="mt-1 h-6 w-9 rounded-t-full bg-[#c8bdb7]" />
    </div>
  )
}

function Rows({ rows, floral = false, minimal = false }: { rows: PreviewRow[]; floral?: boolean; minimal?: boolean }) {
  return (
    <div className={minimal ? 'space-y-0' : 'space-y-1.5'}>
      {rows.map((row) => (
        <div
          key={row.label}
          className={`grid grid-cols-[5.25rem_1fr] gap-2 text-[9px] leading-tight ${
            minimal ? 'border-b border-[#eee8e3] py-1.5' : ''
          }`}
        >
          <span className={floral ? 'text-[#8b7a70]' : 'text-[#777078]'}>{row.label}</span>
          <span className={minimal ? 'font-bold text-[#19191d]' : 'font-medium text-[#29262a]'}>{row.value}</span>
        </div>
      ))}
    </div>
  )
}

function ClassicPreview({ draft, name, subtitle, rows }: PreviewContentProps) {
  return (
    <div className="relative aspect-[1/1.414] w-full overflow-hidden bg-white px-5 pt-6 pb-5 font-serif text-[#19191d]">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[7px] tracking-[0.2em] text-[#777078]">MATRIMONIAL BIODATA</p>
          <p className="mt-1 truncate text-[18px] leading-tight font-bold text-[#c8392f]">{name}</p>
          <p className="mt-1 truncate text-[8px] text-[#46464e]">{subtitle}</p>
        </div>
        <Portrait photo={draft.photo} className="h-[72px] w-[54px] border border-[#e4d9d3]" />
      </div>
      <div className="mt-3 h-0.5 bg-[#c8392f]" />
      <div className="mt-0.5 h-px bg-[#c8392f]" />
      <div className="mt-4 border-l-[3px] border-[#ff5a52] bg-[#fbf7f2] px-2 py-1 text-[8px] font-bold tracking-[0.14em] text-[#c8392f]">
        PERSONAL DETAILS
      </div>
      <div className="mt-3">
        <Rows rows={rows} />
      </div>
      <div className="mt-4 border-l-[3px] border-[#ff5a52] bg-[#fbf7f2] px-2 py-1 text-[8px] font-bold tracking-[0.14em] text-[#c8392f]">
        EDUCATION &amp; CAREER
      </div>
      <div className="mt-3 space-y-1.5">
        <div className="h-1.5 w-full rounded bg-[#e8e1dd]" />
        <div className="h-1.5 w-4/5 rounded bg-[#eee8e4]" />
      </div>
      <PreviewFooter />
    </div>
  )
}

function FloralPreview({ draft, name, subtitle, rows }: PreviewContentProps) {
  return (
    <div className="relative aspect-[1/1.414] w-full overflow-hidden bg-[#fdf6f4] px-8 pt-6 pb-5 font-serif text-[#19191d]">
      <div className="pointer-events-none absolute inset-3 border border-[#a8843c]" aria-hidden />
      <div className="pointer-events-none absolute inset-[15px] border border-[#a8843c]/45" aria-hidden />
      <div className="relative flex flex-col items-center text-center">
        <p className="text-[7px] tracking-[0.22em] text-[#a8843c]">MATRIMONIAL BIODATA</p>
        <p className="mt-1 max-w-full truncate text-[17px] leading-tight font-bold text-[#c8392f]">{name}</p>
        <p className="mt-1 max-w-full truncate text-[8px] text-[#6f6560]">{subtitle}</p>
        <Portrait photo={draft.photo} className="mt-3 h-[68px] w-[51px] border-2 border-white shadow-sm" />
        <div className="mt-3 flex items-center justify-center" aria-hidden>
          <span className="h-px w-10 bg-[#a8843c]" />
          <span className="mx-2 h-2 w-2 rotate-45 bg-[#a8843c]" />
          <span className="h-px w-10 bg-[#a8843c]" />
        </div>
      </div>
      <div className="relative mt-4 text-center text-[8px] font-bold tracking-[0.15em] text-[#c8392f]">
        PERSONAL DETAILS
        <span className="mx-auto mt-1 block h-px w-9 bg-[#a8843c]" />
      </div>
      <div className="relative mt-3">
        <Rows rows={rows} floral />
      </div>
      <PreviewFooter colour="text-[#a8843c]" />
    </div>
  )
}

function MinimalPreview({ draft, name, subtitle, rows }: PreviewContentProps) {
  return (
    <div className="relative aspect-[1/1.414] w-full overflow-hidden bg-white px-6 pt-7 pb-5 text-[#19191d]">
      <div className="absolute inset-y-0 left-0 w-1.5 bg-[#ff5a52]" aria-hidden />
      <div className="flex items-end gap-3">
        <Portrait photo={draft.photo} className="h-[60px] w-[60px]" />
        <div className="min-w-0 flex-1">
          <p className="text-[7px] tracking-[0.24em] text-[#ff5a52]">MATRIMONIAL BIODATA</p>
          <p className="mt-1 truncate text-[18px] leading-tight font-bold">{name}</p>
          <p className="mt-1 truncate text-[8px] text-[#63636b]">{subtitle}</p>
        </div>
      </div>
      <div className="mt-4 h-0.5 w-11 bg-[#ff5a52]" />
      <div className="mt-5 text-[8px] font-bold tracking-[0.2em] text-[#ff5a52]">PERSONAL DETAILS</div>
      <div className="mt-2">
        <Rows rows={rows} minimal />
      </div>
      <div className="mt-5 text-[8px] font-bold tracking-[0.2em] text-[#ff5a52]">EDUCATION &amp; CAREER</div>
      <div className="mt-2 space-y-2 border-t border-[#eee8e3] pt-2">
        <div className="h-1.5 w-full rounded bg-[#e8e4e1]" />
        <div className="h-1.5 w-3/4 rounded bg-[#efebe8]" />
      </div>
      <PreviewFooter />
    </div>
  )
}

function PreviewFooter({ colour = 'text-[#777078]' }: { colour?: string }) {
  return (
    <p className={`absolute right-5 bottom-3 left-5 text-[6px] tracking-wide ${colour}`}>
      Created free at WeddingMall.Online
    </p>
  )
}

interface PreviewContentProps {
  draft: BiodataDraft
  name: string
  subtitle: string
  rows: PreviewRow[]
}

export function TemplateStylePreview({ draft }: { draft: BiodataDraft }) {
  const values = draft.values
  const name = values.fullName || 'Your Name'
  const subtitle = [values.occupation || 'Profession', values.workLocation || 'City, India'].join('  ·  ')
  const rows: PreviewRow[] = [
    { label: 'Date of birth', value: formatDob(values.dob) || '12 April 1996' },
    { label: 'Height', value: values.height || `5' 6" (168 cm)` },
    { label: 'Religion', value: values.religion || 'Your religion' },
    { label: 'Education', value: values.qualification || 'Your qualification' },
  ]
  const meta = TEMPLATES.find((template) => template.id === draft.template) ?? TEMPLATES[0]

  return (
    <section
      aria-label={`${meta.name} format preview`}
      aria-live="polite"
      className="mt-5 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-surface-2)] p-3"
    >
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="text-[14px] font-bold text-[var(--color-ink)]">Preview: {meta.name}</h3>
        <span className="shrink-0 text-[10px] font-semibold tracking-wide text-[var(--color-muted)] uppercase">A4 style</span>
      </div>
      <div
        key={draft.template}
        data-testid="biodata-template-preview"
        data-template={draft.template}
        className="mx-auto w-full max-w-[310px] overflow-hidden rounded-sm shadow-[0_3px_16px_rgba(25,25,29,0.14)]"
      >
        {draft.template === 'classic' ? (
          <ClassicPreview draft={draft} name={name} subtitle={subtitle} rows={rows} />
        ) : draft.template === 'floral' ? (
          <FloralPreview draft={draft} name={name} subtitle={subtitle} rows={rows} />
        ) : (
          <MinimalPreview draft={draft} name={name} subtitle={subtitle} rows={rows} />
        )}
      </div>
      <p className="mt-3 text-center text-[11px] leading-relaxed text-[var(--color-muted)]">{meta.description}</p>
    </section>
  )
}
