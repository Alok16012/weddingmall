import { useCallback, useEffect, useState } from 'react'
import { Intro } from './screens/Intro'
import { Form } from './screens/Form'
import { Preview } from './screens/Preview'
import { hasDraft } from './storage'
import { FIELDS, SECTIONS, type FieldKey } from './types'
import { useBiodataDraft } from './useBiodataDraft'

/**
 * The Biodata Maker, whole.
 *
 * Everything the host app needs is this one component: it owns the draft, the
 * three stages and the routing between them. Mount it on a route and the
 * feature exists — there is no provider to install and no store to register.
 */

type Stage = 'intro' | 'form' | 'preview'

/** The step a validation error belongs to, so we can send the user back to it. */
function stepOfError(keys: FieldKey[]): number {
  for (const [i, section] of SECTIONS.entries()) {
    if (FIELDS.some((f) => f.section === section.id && keys.includes(f.key))) return i
  }
  return 0
}

export function BiodataMaker() {
  const state = useBiodataDraft()
  const [stage, setStage] = useState<Stage>('intro')
  const [resumable, setResumable] = useState(false)
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null)

  // Read once after hydration: whether there is anything worth resuming.
  useEffect(() => {
    if (state.hydrated) setResumable(hasDraft())
  }, [state.hydrated])

  const goPreview = useCallback(() => {
    if (state.validateAll()) {
      setBlockedMessage(null)
      setStage('preview')
      return
    }
    // Land the user on the step that actually needs attention rather than
    // showing an error next to a field they cannot see.
    const keys = Object.keys(state.errors) as FieldKey[]
    state.setStep(stepOfError(keys))
    setStage('form')
    setBlockedMessage('Please complete the highlighted required fields before previewing.')
  }, [state])

  const start = () => {
    state.setStep(0)
    setStage('form')
  }

  const discard = () => {
    state.reset()
    setResumable(false)
    setStage('form')
  }

  if (stage === 'intro') {
    return (
      <Intro
        hasDraft={resumable}
        draft={state.draft}
        onStart={start}
        onResume={() => setStage('form')}
        onDiscard={discard}
        onSelectTemplate={state.setTemplate}
      />
    )
  }

  if (stage === 'preview') {
    return <Preview state={state} onEdit={() => setStage('form')} />
  }

  return (
    <div className="space-y-3">
      {blockedMessage ? (
        <p
          className="rounded-[var(--radius-field)] border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-medium text-red-700"
          role="alert"
        >
          {blockedMessage}
        </p>
      ) : null}
      <Form
        state={state}
        onBackToIntro={() => setStage('intro')}
        onPreview={goPreview}
      />
    </div>
  )
}
