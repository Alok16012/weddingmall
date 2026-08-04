/**
 * Photo handling for the biodata.
 *
 * Every uploaded image is decoded and re-drawn onto a canvas before we keep it.
 * That is the whole sanitisation story for uploads: the bytes we store are
 * bytes *we* produced, so any EXIF payload (including GPS coordinates, which
 * phone cameras write by default), colour-profile blobs or trailing data
 * appended after the JPEG marker are all discarded rather than filtered.
 */

/** Accepted input types. Anything else is rejected before decoding. */
export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']

/** 12 MB in, ~120 KB out. Guards against a 50 MP phone photo stalling the tab. */
export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024

/** Output box. Portrait 3:4 is what matrimonial photos are printed at. */
export const OUT_W = 600
export const OUT_H = 800

export interface Crop {
  /** Zoom factor, 1 = image fitted to the frame. */
  scale: number
  /** Pan offset in output pixels, applied after scaling. */
  x: number
  y: number
}

export const DEFAULT_CROP: Crop = { scale: 1, x: 0, y: 0 }

export class PhotoError extends Error {}

/** Decode a File into an HTMLImageElement, or throw a user-readable error. */
export async function loadImage(file: File): Promise<HTMLImageElement> {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new PhotoError('Please choose a JPG, PNG or WebP image.')
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new PhotoError('That image is larger than 12 MB. Please choose a smaller one.')
  }

  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.decoding = 'async'
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      // A file can claim image/jpeg and still not decode — treat that as invalid.
      img.onerror = () => reject(new PhotoError("That file could not be read as an image."))
      img.src = url
    })
    if (!img.naturalWidth || !img.naturalHeight) {
      throw new PhotoError('That image appears to be empty.')
    }
    return img
  } finally {
    URL.revokeObjectURL(url)
  }
}

/**
 * Render `img` through `crop` into a 600×800 JPEG data URL.
 *
 * `scale: 1` means "cover the frame", so the default view is always full-bleed
 * with no letterboxing however the source is shaped.
 */
export function renderCrop(img: HTMLImageElement, crop: Crop): string {
  const canvas = document.createElement('canvas')
  canvas.width = OUT_W
  canvas.height = OUT_H

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new PhotoError('Your browser could not process the image.')

  // White matte: JPEG has no alpha, and transparent PNGs would otherwise
  // flatten to black on the printed page.
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, OUT_W, OUT_H)
  ctx.imageSmoothingQuality = 'high'

  const cover = Math.max(OUT_W / img.naturalWidth, OUT_H / img.naturalHeight)
  const scale = cover * crop.scale
  const w = img.naturalWidth * scale
  const h = img.naturalHeight * scale
  const x = (OUT_W - w) / 2 + crop.x
  const y = (OUT_H - h) / 2 + crop.y

  ctx.drawImage(img, x, y, w, h)
  return canvas.toDataURL('image/jpeg', 0.88)
}

/** Clamp panning so the frame can never show empty space beside the photo. */
export function clampCrop(img: HTMLImageElement, crop: Crop): Crop {
  const scale = Math.min(Math.max(crop.scale, 1), 4)
  const cover = Math.max(OUT_W / img.naturalWidth, OUT_H / img.naturalHeight) * scale
  const w = img.naturalWidth * cover
  const h = img.naturalHeight * cover
  const maxX = Math.max(0, (w - OUT_W) / 2)
  const maxY = Math.max(0, (h - OUT_H) / 2)
  return {
    scale,
    x: Math.min(Math.max(crop.x, -maxX), maxX),
    y: Math.min(Math.max(crop.y, -maxY), maxY),
  }
}

/** Rough byte size of a data URL, for the storage-quota check. */
export function dataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1)
  return Math.floor((base64.length * 3) / 4)
}
