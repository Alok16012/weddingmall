import { isNativeApp } from './platform'

/**
 * Deep links into the installed app.
 *
 * A link to `https://www.weddingmall.online/blogs/<slug>` shared from the app —
 * or opened from a notification, a search result or a WhatsApp message — should
 * land on that screen inside the app rather than bouncing to the browser. The
 * mapping is one to one because Website, Android and iOS run the same router:
 * the URL path *is* the route.
 *
 * Two link shapes are accepted: our https domain (Android App Links / iOS
 * Universal Links, which additionally need the domain-side association files
 * described in `docs/DEPLOYMENT.md`), and the app's own `online.weddingmall.app`
 * scheme, which works with no domain setup at all.
 */
const HOSTS = ['weddingmall.online', 'www.weddingmall.online']
const SCHEME = 'online.weddingmall.app'

/**
 * The in-app route a deep link points at, or `null` when the URL is not ours.
 *
 * Exported for its own sake: it is pure, and the routing decision is the part
 * worth testing without a WebView.
 */
export function pathFromDeepLink(url: string): string | null {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }

  // online.weddingmall.app://blogs/my-post → host is the first path segment.
  if (parsed.protocol === `${SCHEME}:`) {
    const path = `/${parsed.host}${parsed.pathname}`.replace(/\/{2,}/g, '/')
    return `${path === '/' ? '/' : path.replace(/\/$/, '')}${parsed.search}${parsed.hash}`
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null
  if (!HOSTS.includes(parsed.hostname.toLowerCase())) return null

  const path = parsed.pathname === '' ? '/' : parsed.pathname
  return `${path.length > 1 ? path.replace(/\/$/, '') : path}${parsed.search}${parsed.hash}`
}

/**
 * Start forwarding native deep links to the router.
 *
 * No-op on the web, where the browser has already done this by loading the URL.
 * Returns a cleanup function.
 */
export function startDeepLinkListener(navigate: (path: string) => void): () => void {
  if (!isNativeApp()) return () => {}

  let remove: (() => void) | undefined
  let cancelled = false

  void (async () => {
    try {
      const { App } = await import('@capacitor/app')

      // A cold start from a link: the event may already have fired.
      const launch = await App.getLaunchUrl()
      const initial = launch?.url ? pathFromDeepLink(launch.url) : null
      if (initial && !cancelled) navigate(initial)

      const handle = await App.addListener('appUrlOpen', ({ url }) => {
        const path = pathFromDeepLink(url)
        if (path) navigate(path)
      })
      if (cancelled) void handle.remove()
      else remove = () => void handle.remove()
    } catch {
      /* Plugin missing in this build — links keep opening in the browser. */
    }
  })()

  return () => {
    cancelled = true
    remove?.()
  }
}
