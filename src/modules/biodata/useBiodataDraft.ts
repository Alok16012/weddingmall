import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  biodataSchema,
  fieldsOf,
  type BiodataDraft,
  type FieldKey,
  type SectionId,
  type TemplateId,
} from './types'
import { clearDraft, loadDraft, saveDraft, type SaveResult } from './storage'

/** How long after the last keystroke we persist. Long enough not to thrash storage. */
const AUTOSAVE_MS = 600

export type Errors = Partial<Record<FieldKey, string>>

export interface UseBiodataDraft {
  draft: BiodataDraft
  errors: Errors
  saveState: SaveResult | 'saving' | 'idle'
  setField: (key: FieldKey, value: string) => void
  toggleHidden: (key: FieldKey) => void
  isHidden: (key: FieldKey) => boolean
  setPhoto: (dataUrl: string | null) => void
  setTemplate: (id: TemplateId) => void
  setStep: (step: number) => void
  /** Validate one step; on failure the errors surface and it returns false. */
  validateSection: (section: SectionId) => boolean
  /** Validate everything, for the Preview / Submit gate. */
  validateAll: () => boolean
  reset: () => void
  /** True once the draft has been read from storage (avoids a flash of empty inputs). */
  hydrated: boolean
}

/** Per-field messages from a zod issue list, keyed by field. */
function collectErrors(issues: { path: PropertyKey[]; message: string }[]): Errors {
  const out: Errors = {}
  for (const issue of issues) {
    const key = issue.path[0] as FieldKey | undefined
    if (key && !out[key]) out[key] = issue.message
  }
  return out
}

export function useBiodataDraft(): UseBiodataDraft {
  const [draft, setDraft] = useState<BiodataDraft>(() => loadDraft())
  const [errors, setErrors] = useState<Errors>({})
  const [saveState, setSaveState] = useState<UseBiodataDraft['saveState']>('idle')
  const [hydrated, setHydrated] = useState(false)

  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const dirty = useRef(false)

  // Re-read on mount. `useState` already did this, but running it in an effect
  // too keeps the hook correct under SSR, where the initialiser sees no
  // `window` — which is what makes this module drop straight into Next.js.
  useEffect(() => {
    setDraft(loadDraft())
    setHydrated(true)
  }, [])

  // Debounced autosave.
  useEffect(() => {
    if (!hydrated || !dirty.current) return
    setSaveState('saving')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      setSaveState(saveDraft(draft))
    }, AUTOSAVE_MS)
    return () => clearTimeout(timer.current)
  }, [draft, hydrated])

  // A phone can kill a backgrounded tab without ever firing `unload`, so flush
  // the pending debounce when the page is hidden rather than on unload.
  useEffect(() => {
    const flush = () => {
      if (dirty.current) saveDraft(draft)
    }
    document.addEventListener('visibilitychange', flush)
    window.addEventListener('pagehide', flush)
    return () => {
      document.removeEventListener('visibilitychange', flush)
      window.removeEventListener('pagehide', flush)
    }
  }, [draft])

  const mutate = useCallback((fn: (d: BiodataDraft) => BiodataDraft) => {
    dirty.current = true
    setDraft(fn)
  }, [])

  const setField = useCallback(
    (key: FieldKey, value: string) => {
      mutate((d) => ({ ...d, values: { ...d.values, [key]: value } }))
      // Clear a field's error as soon as the user edits it; re-validation
      // happens when they try to leave the step.
      setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e))
    },
    [mutate],
  )

  const toggleHidden = useCallback(
    (key: FieldKey) =>
      mutate((d) => ({
        ...d,
        hidden: d.hidden.includes(key) ? d.hidden.filter((k) => k !== key) : [...d.hidden, key],
      })),
    [mutate],
  )

  const isHidden = useCallback((key: FieldKey) => draft.hidden.includes(key), [draft.hidden])

  const setPhoto = useCallback((photo: string | null) => mutate((d) => ({ ...d, photo })), [mutate])
  const setTemplate = useCallback((template: TemplateId) => mutate((d) => ({ ...d, template })), [mutate])
  const setStep = useCallback((step: number) => mutate((d) => ({ ...d, step })), [mutate])

  const validateSection = useCallback(
    (section: SectionId) => {
      const result = biodataSchema.safeParse(draft.values)
      if (result.success) {
        setErrors({})
        return true
      }
      const all = collectErrors(result.error.issues)
      const keys = new Set(fieldsOf(section).map((f) => f.key))
      // Only surface problems belonging to the step being left, so an empty
      // Contact step never blocks someone still filling in Personal.
      const mine: Errors = {}
      for (const [k, v] of Object.entries(all)) {
        if (keys.has(k as FieldKey)) mine[k as FieldKey] = v
      }
      setErrors(mine)
      return Object.keys(mine).length === 0
    },
    [draft.values],
  )

  const validateAll = useCallback(() => {
    const result = biodataSchema.safeParse(draft.values)
    if (result.success) {
      setErrors({})
      return true
    }
    setErrors(collectErrors(result.error.issues))
    return false
  }, [draft.values])

  const reset = useCallback(() => {
    clearDraft()
    dirty.current = false
    setErrors({})
    setSaveState('idle')
    setDraft(loadDraft())
  }, [])

  return useMemo(
    () => ({
      draft,
      errors,
      saveState,
      setField,
      toggleHidden,
      isHidden,
      setPhoto,
      setTemplate,
      setStep,
      validateSection,
      validateAll,
      reset,
      hydrated,
    }),
    [
      draft,
      errors,
      saveState,
      setField,
      toggleHidden,
      isHidden,
      setPhoto,
      setTemplate,
      setStep,
      validateSection,
      validateAll,
      reset,
      hydrated,
    ],
  )
}
