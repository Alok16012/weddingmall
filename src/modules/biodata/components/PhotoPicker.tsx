import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ACCEPTED_TYPES,
  DEFAULT_CROP,
  OUT_H,
  OUT_W,
  PhotoError,
  clampCrop,
  loadImage,
  renderCrop,
  type Crop,
} from '../photo'
import { btn, cx } from '../ui'

/**
 * Upload, crop, reposition, preview, change and remove the photograph.
 *
 * The chosen file is decoded once and kept in a ref; every pan or zoom just
 * re-renders it through `renderCrop`, so the JPEG the PDF embeds is produced by
 * exactly the same code path as the on-screen preview. The original file bytes
 * are never stored — see the note in `photo.ts` about EXIF/GPS stripping.
 */

const FRAME_W = 168
const FRAME_H = (FRAME_W * OUT_H) / OUT_W

interface PhotoPickerProps {
  photo: string | null
  onChange: (dataUrl: string | null) => void
}

export function PhotoPicker({ photo, onChange }: PhotoPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const drag = useRef<{ x: number; y: number; crop: Crop } | null>(null)

  const [crop, setCrop] = useState<Crop>(DEFAULT_CROP)
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const apply = useCallback(
    (next: Crop) => {
      const img = imgRef.current
      if (!img) return
      const clamped = clampCrop(img, next)
      setCrop(clamped)
      onChange(renderCrop(img, clamped))
    },
    [onChange],
  )

  const pick = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      const img = await loadImage(file)
      imgRef.current = img
      setCrop(DEFAULT_CROP)
      onChange(renderCrop(img, DEFAULT_CROP))
      setEditing(true)
    } catch (err) {
      setError(err instanceof PhotoError ? err.message : 'That image could not be used.')
    } finally {
      setBusy(false)
      // Allow re-picking the same file after a removal.
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const remove = () => {
    imgRef.current = null
    setCrop(DEFAULT_CROP)
    setEditing(false)
    setError(null)
    onChange(null)
  }

  // Pointer drag → pan. Scale from the frame's on-screen size to output pixels
  // so a finger moves the photo by the distance it looks like it should.
  const onPointerDown = (e: React.PointerEvent) => {
    if (!imgRef.current) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX, y: e.clientY, crop }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const start = drag.current
    if (!start) return
    const k = OUT_W / FRAME_W
    apply({
      scale: start.crop.scale,
      x: start.crop.x + (e.clientX - start.x) * k,
      y: start.crop.y + (e.clientY - start.y) * k,
    })
  }

  const onPointerUp = () => {
    drag.current = null
  }

  useEffect(() => () => void (imgRef.current = null), [])

  // A draft restored from storage has a photo but no decoded source image, so
  // the crop controls stay hidden until the user picks a new file.
  const canEdit = editing && imgRef.current !== null

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
      <div
        className={cx(
          'relative shrink-0 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-surface-2)]',
          canEdit && 'cursor-grab touch-none active:cursor-grabbing',
        )}
        style={{ width: FRAME_W, height: FRAME_H }}
        onPointerDown={canEdit ? onPointerDown : undefined}
        onPointerMove={canEdit ? onPointerMove : undefined}
        onPointerUp={canEdit ? onPointerUp : undefined}
        onPointerCancel={canEdit ? onPointerUp : undefined}
      >
        {photo ? (
          <img src={photo} alt="Your biodata photograph" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-4 text-center">
            <svg viewBox="0 0 24 24" className="h-7 w-7 text-[var(--color-muted)]" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <circle cx="9" cy="10" r="1.8" />
              <path d="M3 16l4.5-4 4 3.5L15 12l6 5" />
            </svg>
            <span className="text-[12px] text-[var(--color-muted)]">Portrait photo, 3:4</span>
          </div>
        )}
      </div>

      <div className="w-full max-w-xs space-y-2.5">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          className="sr-only"
          onChange={(e) => void pick(e.target.files?.[0])}
        />

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={btn({ variant: photo ? 'outline' : 'primary', size: 'sm' })}
            onClick={() => inputRef.current?.click()}
            disabled={busy}
          >
            {busy ? 'Reading…' : photo ? 'Change photo' : 'Upload photo'}
          </button>
          {photo ? (
            <button type="button" className={btn({ variant: 'ghost', size: 'sm' })} onClick={remove}>
              Remove
            </button>
          ) : null}
        </div>

        {canEdit ? (
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-[12px] font-medium text-[var(--color-muted)]">
              Zoom
              <input
                type="range"
                min={1}
                max={4}
                step={0.02}
                value={crop.scale}
                onChange={(e) => apply({ ...crop, scale: Number(e.target.value) })}
                className="h-1.5 flex-1 accent-[var(--color-primary)]"
              />
            </label>
            <p className="text-[12px] text-[var(--color-muted)]">Drag the photo to reposition it.</p>
          </div>
        ) : (
          <p className="text-[12px] text-[var(--color-muted)]">
            Optional. A clear, front-facing portrait works best. Your photo stays on this device — it
            is never uploaded.
          </p>
        )}

        {error ? <p className="text-[12px] font-medium text-red-600">{error}</p> : null}
      </div>
    </div>
  )
}
