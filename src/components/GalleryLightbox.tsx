import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Share2, X } from 'lucide-react'
import type { MediaItem } from '@/types/domain'
import { cn } from '@/lib/cn'

/** Full-screen gallery viewer — counter, prev/next, thumbnails, share (spec C-09). */
export function GalleryLightbox({
  media,
  startIndex = 0,
  title,
  onClose,
}: {
  media: MediaItem[]
  startIndex?: number
  title?: string
  onClose: () => void
}) {
  const [index, setIndex] = useState(startIndex)
  const count = media.length

  const go = useCallback(
    (dir: 1 | -1) => setIndex((i) => (i + dir + count) % count),
    [count],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [go, onClose])

  async function share() {
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title: title ?? 'WeddingMall', url })
      else await navigator.clipboard.writeText(url)
    } catch {
      /* user dismissed share sheet — no-op */
    }
  }

  const current = media[index]

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${title ?? 'Gallery'} — photo ${index + 1} of ${count}`}
      className="anim-backdrop-in fixed inset-0 z-50 flex flex-col bg-black/95"
    >
      <div className="flex items-center justify-between p-4 text-white">
        <button onClick={onClose} aria-label="Close gallery" className="tap grid h-10 w-10 place-items-center rounded-full bg-white/10">
          <X className="h-5 w-5" aria-hidden />
        </button>
        <span className="tnum text-sm font-medium">
          {index + 1} / {count}
        </span>
        <button onClick={share} aria-label="Share" className="tap grid h-10 w-10 place-items-center rounded-full bg-white/10">
          <Share2 className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-2">
        <img
          key={current.id}
          src={current.url}
          alt={current.alt}
          className="anim-pop-in max-h-full max-w-full rounded-[var(--radius-card)] object-contain"
        />
        {count > 1 && (
          <>
            <button onClick={() => go(-1)} aria-label="Previous photo" className="tap absolute left-2 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white">
              <ChevronLeft className="h-6 w-6" aria-hidden />
            </button>
            <button onClick={() => go(1)} aria-label="Next photo" className="tap absolute right-2 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white">
              <ChevronRight className="h-6 w-6" aria-hidden />
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto p-4">
          {media.map((m, i) => (
            <button
              key={m.id}
              onClick={() => setIndex(i)}
              aria-label={`View photo ${i + 1}`}
              aria-current={i === index}
              className={cn(
                'h-14 w-14 shrink-0 overflow-hidden rounded-[var(--radius-field)] ring-2 transition',
                i === index ? 'ring-coral' : 'ring-transparent opacity-60',
              )}
            >
              <img src={m.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
