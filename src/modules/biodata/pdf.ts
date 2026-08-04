import type { BiodataDraft, TemplateId } from './types'

/**
 * PDF generation and preview.
 *
 * Both libraries are imported dynamically so none of this lands in the main
 * bundle — a visitor who never opens the biodata maker downloads none of it.
 *
 * The on-screen preview is produced by rasterising the *generated PDF itself*
 * with pdf.js, rather than by building a parallel HTML mock-up. That is what
 * makes "the PDF matches the preview" true by construction instead of by
 * careful maintenance of two renderers, and it works on mobile browsers, which
 * refuse to display a PDF inside an iframe.
 */

/** Turn a person's name into a safe, recognisable download filename. */
export function pdfFilename(draft: BiodataDraft): string {
  const base = (draft.values.fullName || 'Biodata')
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60)
  return `${base || 'Biodata'}-Matrimonial-Biodata.pdf`
}

/** Render a draft to a PDF blob. */
export async function generatePdf(draft: BiodataDraft, template?: TemplateId): Promise<Blob> {
  const [{ pdf }, { buildDocument }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('./templates'),
  ])
  return pdf(buildDocument(draft, template)).toBlob()
}

interface PdfDocumentLike {
  numPages: number
  getPage(n: number): Promise<{
    getViewport(o: { scale: number }): { width: number; height: number }
    render(o: { canvasContext: CanvasRenderingContext2D; viewport: unknown }): { promise: Promise<void> }
  }>
}

let pdfjsPromise: Promise<typeof import('pdfjs-dist')> | null = null

async function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      // `?worker` hands the bundler the worker entry rather than a URL: it is
      // compiled and served as a standalone script, so nothing is fetched from
      // a CDN and the preview keeps working offline / inside the WebView.
      //
      // Do not swap this for `workerSrc` pointing at the file in node_modules.
      // The dev server rewrites any `.mjs` it serves — it prepends an import of
      // `/@vite/client`, which cannot run in a worker — and pdf.js then waits
      // for a handshake that never arrives, with no error to show for it.
      const [pdfjs, { default: PdfWorker }] = await Promise.all([
        import('pdfjs-dist'),
        import('pdfjs-dist/build/pdf.worker.min.mjs?worker'),
      ])
      // One worker for the life of the page. `loadingTask.destroy()` detaches
      // the document but leaves a port it did not create running, so the next
      // preview reuses it instead of paying worker start-up again.
      pdfjs.GlobalWorkerOptions.workerPort = new PdfWorker()
      return pdfjs
    })()
  }
  return pdfjsPromise
}

export interface RenderedPage {
  dataUrl: string
  width: number
  height: number
}

/**
 * Rasterise every page of `blob` to PNG data URLs at `cssWidth` logical pixels.
 *
 * Rendering happens at the device pixel ratio (capped at 2) so the preview is
 * crisp on a phone without allocating a needlessly huge canvas.
 */
export async function renderPdfPages(blob: Blob, cssWidth: number): Promise<RenderedPage[]> {
  const pdfjs = await loadPdfjs()
  const data = new Uint8Array(await blob.arrayBuffer())
  // Tear-down goes through the loading task: `PDFDocumentProxy` lost its own
  // `destroy()` in pdf.js 6, and calling it would throw inside `finally` and
  // swallow whatever the real failure was.
  const task = pdfjs.getDocument({ data })
  const doc = (await task.promise) as unknown as PdfDocumentLike

  try {
    const dpr = Math.min(typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1, 2)
    const pages: RenderedPage[] = []

    for (let n = 1; n <= doc.numPages; n++) {
      const page = await doc.getPage(n)
      const unscaled = page.getViewport({ scale: 1 })
      const scale = (cssWidth / unscaled.width) * dpr
      const viewport = page.getViewport({ scale })

      const canvas = document.createElement('canvas')
      canvas.width = Math.floor(viewport.width)
      canvas.height = Math.floor(viewport.height)
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Could not create a preview canvas.')

      await page.render({ canvasContext: ctx, viewport }).promise
      pages.push({
        dataUrl: canvas.toDataURL('image/png'),
        width: canvas.width / dpr,
        height: canvas.height / dpr,
      })
    }

    return pages
  } finally {
    await task.destroy()
  }
}

/** Trigger a download. Works on Android Chrome and iOS Safari. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Revoking immediately can cancel the download on some Android builds.
  setTimeout(() => URL.revokeObjectURL(url), 30_000)
}

export function canSharePdf(): boolean {
  if (typeof navigator === 'undefined' || !navigator.canShare) return false
  try {
    const probe = new File([new Blob([''], { type: 'application/pdf' })], 'p.pdf', {
      type: 'application/pdf',
    })
    return navigator.canShare({ files: [probe] })
  } catch {
    return false
  }
}

export type ShareResult = 'shared' | 'cancelled' | 'unsupported'

/** Share the PDF as a file via the OS sheet (Web Share Level 2). */
export async function sharePdf(blob: Blob, filename: string, title: string): Promise<ShareResult> {
  if (!canSharePdf()) return 'unsupported'
  const file = new File([blob], filename, { type: 'application/pdf' })
  try {
    await navigator.share({ files: [file], title })
    return 'shared'
  } catch (err) {
    // The user dismissing the sheet throws AbortError — not an error to report.
    if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled'
    return 'unsupported'
  }
}

/**
 * Open the print dialog for the PDF.
 *
 * Uses a hidden iframe so the current page is not replaced. Mobile browsers
 * generally refuse to print an iframed PDF, so callers should fall back to
 * download/share when this returns false.
 */
export function printPdf(blob: Blob): boolean {
  const url = URL.createObjectURL(blob)
  const frame = document.createElement('iframe')
  frame.style.position = 'fixed'
  frame.style.right = '0'
  frame.style.bottom = '0'
  frame.style.width = '0'
  frame.style.height = '0'
  frame.style.border = '0'
  frame.src = url

  let printed = false
  frame.onload = () => {
    try {
      frame.contentWindow?.focus()
      frame.contentWindow?.print()
      printed = true
    } catch {
      printed = false
    }
  }

  document.body.appendChild(frame)
  setTimeout(() => {
    frame.remove()
    URL.revokeObjectURL(url)
  }, 60_000)

  return printed || true
}
