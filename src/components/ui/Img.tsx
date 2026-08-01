import { useState } from 'react'
import { cn } from '@/lib/cn'
import { imageUrl, srcSet } from '@/lib/image'

interface ImgProps {
  src: string | null | undefined
  alt: string
  /** Rendered CSS size in px — also drives what we request from the CDN. */
  width: number
  height: number
  className?: string
  /** Wrapper class; the wrapper reserves space so nothing shifts on load. */
  wrapperClassName?: string
  rounded?: string
  priority?: boolean
  fallback?: React.ReactNode
}

/**
 * Image with three things a bare <img> lacks here:
 *  1. CDN-resized source (see lib/image.ts) instead of a 1600 px original
 *  2. Reserved space + tinted placeholder, so there is zero layout shift
 *  3. A soft fade/scale-settle once decoded — the motion that makes lists feel
 *     alive. Skipped entirely under prefers-reduced-motion via the CSS guard.
 */
export function Img({
  src,
  alt,
  width,
  height,
  className,
  wrapperClassName,
  rounded = 'rounded-[var(--radius-field)]',
  priority = false,
  fallback,
}: ImgProps) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const url = imageUrl(src, { width, height })

  return (
    <div className={cn('relative overflow-hidden bg-surface-2', rounded, wrapperClassName)}>
      {/* Placeholder tint — visible until the bitmap is decoded */}
      {!loaded && !failed && <div className="absolute inset-0 skeleton" aria-hidden />}

      {url && !failed ? (
        <img
          src={url}
          srcSet={srcSet(src, { width, height })}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn('img-fade h-full w-full object-cover', loaded && 'is-loaded', className)}
        />
      ) : (
        <div className="grid h-full w-full place-items-center text-muted">{fallback}</div>
      )}
    </div>
  )
}
