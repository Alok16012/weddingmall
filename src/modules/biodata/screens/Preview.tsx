import { useCallback, useEffect, useRef, useState } from 'react'
import { TEMPLATES, unsupportedValues } from '../templates/props'
import {
  canSharePdf,
  downloadBlob,
  generatePdf,
  pdfFilename,
  printPdf,
  renderPdfPages,
  sharePdf,
  type RenderedPage,
} from '../pdf'
import { btn, cx } from '../ui'
import type { UseBiodataDraft } from '../useBiodataDraft'

/**
 * Template picker + preview + export.
 *
 * The preview is the generated PDF itself, rasterised page by page. Nothing is
 * rendered twice in two languages, so "the download matches what I saw" holds
 * by construction rather than by discipline.
 */

/** Rasterise at a fixed logical width; the DPR multiplier lives in `renderPdfPages`. */
const PREVIEW_WIDTH = 720

type Status = 'idle' | 'rendering' | 'ready' | 'error'

interface PreviewProps {
  state: UseBiodataDraft
  onEdit: () => void
}

export function Preview({ state, onEdit }: PreviewProps) {
  const { draft, setTemplate } = state

  const [pages, setPages] = useState<RenderedPage[]>([])
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const blobRef = useRef<Blob | null>(null)
  const runId = useRef(0)

  const shareable = canSharePdf()
  const unsupported = unsupportedValues(draft)

  const render = useCallback(async () => {
    const id = ++runId.current
    setStatus('rendering')
    setMessage(null)
    try {
      const blob = await generatePdf(draft)
      if (id !== runId.current) return
      blobRef.current = blob
      const rendered = await renderPdfPages(blob, PREVIEW_WIDTH)
      if (id !== runId.current) return
      setPages(rendered)
      setStatus('ready')
    } catch (err) {
      if (id !== runId.current) return
      blobRef.current = null
      setStatus('error')
      setMessage(err instanceof Error ? err.message : 'The preview could not be generated.')
    }
  }, [draft])

  useEffect(() => {
    void render()
    // Invalidate any in-flight render when the draft changes again. `runId` is
    // a plain counter, not a DOM ref, so reading it in cleanup is correct.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => void runId.current++
  }, [render])

  const flash = (text: string) => {
    setToast(text)
    setTimeout(() => setToast(null), 3200)
  }

  /** Regenerate on demand so an export never ships a stale blob. */
  const withPdf = async (fn: (blob: Blob) => void | Promise<void>) => {
    setBusy(true)
    try {
      const blob = blobRef.current ?? (await generatePdf(draft))
      blobRef.current = blob
      await fn(blob)
    } catch {
      flash('Something went wrong generating the PDF. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const onDownload = () =>
    withPdf((blob) => {
      downloadBlob(blob, pdfFilename(draft))
      flash('Biodata downloaded.')
    })

  const onShare = () =>
    withPdf(async (blob) => {
      const result = await sharePdf(blob, pdfFilename(draft), 'Matrimonial Biodata')
      if (result === 'unsupported') {
        downloadBlob(blob, pdfFilename(draft))
        flash('Sharing is not available here, so the PDF was downloaded instead.')
      }
    })

  const onPrint = () =>
    withPdf((blob) => {
      printPdf(blob)
    })

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-[20px] font-bold text-[var(--color-ink)]">
            Choose a design
          </h1>
          <p className="mt-1 text-[13px] text-[var(--color-muted)]">
            Tap a design to preview it. The PDF you download is exactly what you see here.
          </p>
        </div>
        <button type="button" className={btn({ variant: 'outline', size: 'sm' })} onClick={onEdit}>
          Edit details
        </button>
      </header>

      <div className="grid grid-cols-3 gap-2.5">
        {TEMPLATES.map((t) => {
          const active = draft.template === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTemplate(t.id)}
              aria-pressed={active}
              className={cx(
                'overflow-hidden rounded-[var(--radius-field)] border text-left transition-shadow',
                active
                  ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/30'
                  : 'border-[var(--color-line)]',
              )}
            >
              <div
                className="flex h-16 flex-col justify-center gap-1.5 px-2.5"
                style={{ backgroundColor: t.swatch[1] }}
                aria-hidden
              >
                <span className="block h-1.5 w-8 rounded-full" style={{ backgroundColor: t.swatch[0] }} />
                <span className="block h-1 w-full rounded-full bg-black/12" />
                <span className="block h-1 w-3/4 rounded-full bg-black/10" />
              </div>
              <p className="px-2 py-1.5 text-[11px] leading-tight font-semibold text-[var(--color-ink)]">
                {t.name}
              </p>
            </button>
          )
        })}
      </div>

      <p className="text-[12px] leading-relaxed text-[var(--color-muted)]">
        {TEMPLATES.find((t) => t.id === draft.template)?.description}
      </p>

      {unsupported.length > 0 ? (
        <div className="rounded-[var(--radius-field)] border border-amber-300 bg-amber-50 px-3 py-2.5">
          <p className="text-[12px] leading-relaxed text-amber-900">
            Some of your answers use characters the PDF fonts cannot print (for example Hindi or
            regional scripts) and will come out blank. Please retype them in English — for instance{' '}
            <span className="font-semibold">{unsupported[0]}</span>.
          </p>
        </div>
      ) : null}

      <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-surface-2)] p-3">
        {status === 'rendering' && pages.length === 0 ? (
          <div className="flex aspect-[1/1.414] w-full items-center justify-center rounded bg-white">
            <span
              className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent"
              aria-label="Generating preview"
            />
          </div>
        ) : status === 'error' ? (
          <div className="flex aspect-[1/1.414] w-full flex-col items-center justify-center gap-3 rounded bg-white px-6 text-center">
            <p className="text-[13px] text-[var(--color-muted)]">{message}</p>
            <button type="button" className={btn({ variant: 'outline', size: 'sm' })} onClick={() => void render()}>
              Try again
            </button>
          </div>
        ) : (
          <div className={cx('space-y-3', status === 'rendering' && 'opacity-60')}>
            {pages.map((page, i) => (
              <img
                key={i}
                src={page.dataUrl}
                alt={`Biodata preview, page ${i + 1} of ${pages.length}`}
                className="w-full rounded bg-white shadow-[0_2px_10px_rgba(25,25,29,0.10)]"
              />
            ))}
          </div>
        )}
        {pages.length > 1 ? (
          <p className="mt-2 text-center text-[11px] text-[var(--color-muted)]">
            {pages.length} pages · A4
          </p>
        ) : null}
      </div>

      <div className="sticky bottom-[var(--biodata-sticky-offset,0px)] -mx-4 border-t border-[var(--color-line)] bg-[var(--color-canvas)]/95 px-4 py-3 backdrop-blur">
        <div className="flex gap-2">
          <button
            type="button"
            className={btn({ size: 'md', className: 'flex-1' })}
            onClick={() => void onDownload()}
            disabled={busy || status === 'error'}
          >
            {busy ? 'Preparing…' : 'Download PDF'}
          </button>
          {shareable ? (
            <button
              type="button"
              className={btn({ variant: 'outline', size: 'md' })}
              onClick={() => void onShare()}
              disabled={busy || status === 'error'}
            >
              Share
            </button>
          ) : null}
          <button
            type="button"
            className={btn({ variant: 'outline', size: 'md' })}
            onClick={() => void onPrint()}
            disabled={busy || status === 'error'}
          >
            Print
          </button>
        </div>
        {toast ? (
          <p className="mt-1.5 text-[12px] text-[var(--color-muted)]" role="status" aria-live="polite">
            {toast}
          </p>
        ) : null}
      </div>
    </div>
  )
}
