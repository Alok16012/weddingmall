/**
 * Image sizing.
 *
 * Vendor photos live in Supabase Storage at full camera resolution (commonly
 * 1600×1066, ~240 KB). Rendering those into a 104 px thumbnail wasted ~23× the
 * bytes and made scrolling feel heavy. Supabase's render endpoint resizes on the
 * CDN, so we ask for exactly what we display.
 *
 *   /object/public/<path>            → original
 *   /render/image/public/<path>?…    → resized + re-encoded
 */

const OBJECT = '/storage/v1/object/public/'
const RENDER = '/storage/v1/render/image/public/'

export interface ImgOpts {
  width: number
  height?: number
  quality?: number
  /** 'cover' crops to fill (default), 'contain' fits inside. */
  resize?: 'cover' | 'contain'
}

/**
 * Returns a CDN-resized URL for Supabase-hosted images; any other URL
 * (e.g. Unsplash) is returned with its own sizing params where possible.
 */
export function imageUrl(src: string | null | undefined, opts: ImgOpts): string | undefined {
  if (!src) return undefined
  const { width, height, quality = 72, resize = 'cover' } = opts

  if (src.includes(OBJECT)) {
    const params = new URLSearchParams({ width: String(width), quality: String(quality), resize })
    if (height) params.set('height', String(height))
    return `${src.replace(OBJECT, RENDER)}?${params.toString()}`
  }

  // Unsplash supports the same intent via its own query API.
  if (src.includes('images.unsplash.com')) {
    const u = new URL(src)
    u.searchParams.set('w', String(width))
    if (height) u.searchParams.set('h', String(height))
    u.searchParams.set('fit', 'crop')
    u.searchParams.set('q', String(quality))
    u.searchParams.set('auto', 'format')
    return u.toString()
  }

  return src
}

/** 1x/2x srcset so retina screens stay crisp without over-fetching on 1x. */
export function srcSet(src: string | null | undefined, opts: ImgOpts): string | undefined {
  if (!src) return undefined
  const one = imageUrl(src, opts)
  const two = imageUrl(src, { ...opts, width: opts.width * 2, height: opts.height ? opts.height * 2 : undefined })
  return one && two ? `${one} 1x, ${two} 2x` : undefined
}
