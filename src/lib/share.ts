import { isNativeApp } from './platform'

export interface ShareRequest {
  title: string
  text: string
  url: string
}

export type ShareOutcome = 'shared' | 'copied' | 'dismissed' | 'unavailable'

/**
 * Share through whatever the current platform actually offers.
 *
 * Inside the installed app that is the Android / iOS system share sheet via
 * Capacitor; on the web it is the Web Share API where the browser has it (all
 * mobile browsers, Safari on macOS), falling back to copying the link. The
 * plugin is imported lazily so desktop web never pays for native code it cannot
 * use.
 */
export async function shareContent(req: ShareRequest): Promise<ShareOutcome> {
  if (isNativeApp()) {
    try {
      const { Share } = await import('@capacitor/share')
      const { value } = await Share.canShare()
      if (value) {
        await Share.share({ title: req.title, text: req.text, url: req.url, dialogTitle: req.title })
        return 'shared'
      }
    } catch (err) {
      // A user-cancelled sheet rejects too; treat it as a dismissal rather than
      // dropping through to the clipboard, which would be a surprise.
      if (isCancellation(err)) return 'dismissed'
    }
  }

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share(req)
      return 'shared'
    } catch (err) {
      if (isCancellation(err)) return 'dismissed'
    }
  }

  try {
    await navigator.clipboard.writeText(`${req.text} ${req.url}`)
    return 'copied'
  } catch {
    return 'unavailable'
  }
}

function isCancellation(err: unknown): boolean {
  const e = err as { name?: string; message?: string } | null
  return e?.name === 'AbortError' || /cancel|abort|dismiss/i.test(e?.message ?? '')
}
