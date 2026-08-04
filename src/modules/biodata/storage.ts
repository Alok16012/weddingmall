import { EMPTY_DRAFT, biodataSchema, type BiodataDraft, type FieldKey, type TemplateId } from './types'

/**
 * Local draft persistence.
 *
 * The key is versioned: if the field set ever changes shape, bump SCHEMA_VERSION
 * and old drafts are discarded instead of half-loading into a form that no
 * longer matches them.
 */
const SCHEMA_VERSION = 1
const KEY = `wm.biodata.draft.v${SCHEMA_VERSION}`

/** Photos are the only large value here; cap the draft so we never blow the ~5 MB quota. */
const MAX_DRAFT_BYTES = 3_500_000

const TEMPLATES: TemplateId[] = ['classic', 'floral', 'minimal']

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

/**
 * Read the saved draft.
 *
 * Anything stored could have been hand-edited in devtools, so the values go
 * back through the same zod schema the form uses rather than being trusted.
 */
export function loadDraft(): BiodataDraft {
  if (!isBrowser()) return EMPTY_DRAFT
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return EMPTY_DRAFT

    const parsed = JSON.parse(raw) as Partial<BiodataDraft>
    const values = biodataSchema.partial().safeParse(parsed.values ?? {})

    return {
      values: { ...EMPTY_DRAFT.values, ...(values.success ? values.data : {}) },
      hidden: Array.isArray(parsed.hidden) ? (parsed.hidden.filter((k) => typeof k === 'string') as FieldKey[]) : [],
      photo: typeof parsed.photo === 'string' && parsed.photo.startsWith('data:image/') ? parsed.photo : null,
      template: TEMPLATES.includes(parsed.template as TemplateId) ? (parsed.template as TemplateId) : 'classic',
      step: Number.isInteger(parsed.step) && parsed.step! >= 0 ? Math.min(parsed.step!, 4) : 0,
    }
  } catch {
    // Corrupt JSON, or storage disabled (Safari private mode) — start fresh.
    return EMPTY_DRAFT
  }
}

export type SaveResult = 'saved' | 'too-large' | 'unavailable'

export function saveDraft(draft: BiodataDraft): SaveResult {
  if (!isBrowser()) return 'unavailable'
  try {
    const json = JSON.stringify(draft)
    if (json.length > MAX_DRAFT_BYTES) {
      // Keep the typed answers even when the photo is what pushed us over.
      const withoutPhoto = JSON.stringify({ ...draft, photo: null })
      if (withoutPhoto.length <= MAX_DRAFT_BYTES) {
        window.localStorage.setItem(KEY, withoutPhoto)
      }
      return 'too-large'
    }
    window.localStorage.setItem(KEY, json)
    return 'saved'
  } catch {
    return 'unavailable'
  }
}

export function clearDraft(): void {
  if (!isBrowser()) return
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    /* storage disabled — nothing to clear */
  }
}

/** True when a saved draft holds anything the user would be sad to lose. */
export function hasDraft(): boolean {
  if (!isBrowser()) return false
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return false
    const parsed = JSON.parse(raw) as Partial<BiodataDraft>
    if (parsed.photo) return true
    return Object.values(parsed.values ?? {}).some((v) => typeof v === 'string' && v.trim() !== '')
  } catch {
    return false
  }
}
