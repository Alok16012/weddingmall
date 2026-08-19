import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  completeOnboarding,
  isOnboardingComplete,
  ONBOARDING_RESET_EVENT,
} from '@/services/appState'
import { track } from '@/lib/analytics'
import { cn } from '@/lib/cn'

/**
 * First-run spotlight tour.
 *
 * Seven steps, each anchored to a real control that is already on screen — the
 * point is to teach the actual interface, so a step whose anchor is missing
 * (a listing hasn't loaded, say) falls back to a centred card rather than
 * pointing at nothing.
 *
 * Completion is stored on the device and, when there is an account, synced to
 * `user_app_state` — so a returning user isn't onboarded again on a new phone.
 */
interface Step {
  /** `[data-tour="…"]` value of the control this step is about. */
  anchor: string
  title: string
  body: string
}

const STEPS: Step[] = [
  {
    anchor: 'venue',
    title: 'Find your perfect venue',
    body: 'Banquet halls, lawns, resorts and hotels — filtered by your city and budget.',
  },
  {
    anchor: 'vendors',
    title: 'Explore verified vendors',
    body: 'Makeup, photography, mehendi, décor and everything else your day needs.',
  },
  {
    anchor: 'shortlist',
    title: 'Shortlist your favourites',
    body: 'Tap the heart to save a listing and compare your options side by side.',
  },
  {
    anchor: 'enquire',
    title: 'Send enquiries directly',
    body: 'Share your date and guest count once; the vendor replies with real pricing.',
  },
  {
    anchor: 'contact',
    title: 'Call or WhatsApp vendors',
    body: 'Reach a vendor the way you prefer, straight from their listing.',
  },
  {
    anchor: 'more',
    title: 'Track bookings and enquiries',
    body: 'My Bookings and Inbox keep every conversation and its status in one place.',
  },
  {
    anchor: 'more',
    title: 'Explore Wedding Mall tools',
    body: 'The free biodata maker, reviews and wedding ideas all live under More.',
  },
]

const PAD = 8

export function OnboardingTour() {
  const [active, setActive] = useState(false)
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  // Decide once per launch. The check is local-first, so this resolves
  // immediately for everyone who has already seen it.
  useEffect(() => {
    let cancelled = false
    void isOnboardingComplete().then((done) => {
      if (cancelled || done) return
      setActive(true)
      track('onboarding_started', { steps: STEPS.length })
    })
    // "Replay app tour" clears the flag while this is already mounted.
    const replay = () => {
      setStep(0)
      setActive(true)
      track('onboarding_started', { steps: STEPS.length, replay: true })
    }
    window.addEventListener(ONBOARDING_RESET_EVENT, replay)
    return () => {
      cancelled = true
      window.removeEventListener(ONBOARDING_RESET_EVENT, replay)
    }
  }, [])

  const measure = useCallback(() => {
    if (!active) return
    const el = document.querySelector<HTMLElement>(`[data-tour="${STEPS[step].anchor}"]`)
    setRect(el ? el.getBoundingClientRect() : null)
  }, [active, step])

  useLayoutEffect(() => {
    if (!active) return
    const el = document.querySelector<HTMLElement>(`[data-tour="${STEPS[step].anchor}"]`)
    el?.scrollIntoView({ block: 'center', behavior: 'auto' })
    measure()
  }, [active, step, measure])

  useEffect(() => {
    if (!active) return
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [active, measure])

  // Focus the card each step so a screen reader announces the new copy and
  // keyboard users stay inside the tour.
  useEffect(() => {
    if (active) cardRef.current?.focus()
  }, [active, step])

  const finish = useCallback(
    (reason: 'completed' | 'skipped') => {
      setActive(false)
      track('onboarding_completed', { reason, last_step: step + 1, steps: STEPS.length })
      void completeOnboarding()
    },
    [step],
  )

  useEffect(() => {
    if (!active) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') finish('skipped')
      if (e.key === 'ArrowRight') setStep((s) => Math.min(s + 1, STEPS.length - 1))
      if (e.key === 'ArrowLeft') setStep((s) => Math.max(s - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, finish])

  if (!active) return null

  const last = step === STEPS.length - 1
  const s = STEPS[step]

  // The cutout is drawn as four dimmed panels around the target rather than an
  // SVG mask — it stays crisp at every zoom level and costs no extra layer.
  const hole = rect
    ? {
        top: Math.max(rect.top - PAD, 0),
        left: Math.max(rect.left - PAD, 0),
        width: rect.width + PAD * 2,
        height: rect.height + PAD * 2,
      }
    : null

  const dim = 'fixed bg-[#221f20]/70'
  // Below the target when there is room above it, otherwise above.
  const cardBelow = hole ? hole.top < window.innerHeight / 2 : true

  return createPortal(
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="App tour">
      {hole ? (
        <>
          <div className={dim} style={{ top: 0, left: 0, right: 0, height: hole.top }} />
          <div
            className={dim}
            style={{ top: hole.top + hole.height, left: 0, right: 0, bottom: 0 }}
          />
          <div className={dim} style={{ top: hole.top, left: 0, width: hole.left, height: hole.height }} />
          <div
            className={dim}
            style={{ top: hole.top, left: hole.left + hole.width, right: 0, height: hole.height }}
          />
          <div
            aria-hidden
            className="pointer-events-none fixed rounded-[var(--radius-card)] ring-2 ring-white"
            style={{ top: hole.top, left: hole.left, width: hole.width, height: hole.height }}
          />
        </>
      ) : (
        <div className="fixed inset-0 bg-[#221f20]/70" />
      )}

      <div
        ref={cardRef}
        tabIndex={-1}
        className={cn(
          'fixed inset-x-4 mx-auto max-w-sm rounded-[var(--radius-card)] bg-surface p-4 shadow-[var(--shadow-card)] outline-none',
          !hole && 'top-1/2 -translate-y-1/2',
        )}
        style={
          hole
            ? cardBelow
              ? { top: Math.min(hole.top + hole.height + 12, window.innerHeight - 200) }
              : { bottom: Math.min(window.innerHeight - hole.top + 12, window.innerHeight - 200) }
            : undefined
        }
      >
        <p className="tnum text-xs font-semibold uppercase tracking-wide text-muted">
          Step {step + 1} of {STEPS.length}
        </p>
        <h2 className="mt-1 text-xl text-ink">{s.title}</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{s.body}</p>

        <div className="mt-4 flex items-center gap-2">
          <div className="flex flex-1 gap-1" aria-hidden>
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={cn(
                  'h-1 flex-1 rounded-full',
                  i <= step ? 'bg-[var(--color-primary)]' : 'bg-line',
                )}
              />
            ))}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => finish('skipped')}
            className="tap px-1 py-2 text-sm font-semibold text-muted"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={() => (last ? finish('completed') : setStep((v) => v + 1))}
            className="tap rounded-[var(--radius-field)] bg-[var(--color-primary)] px-5 py-2.5 text-sm font-bold text-white"
          >
            {last ? 'Got It' : 'Next'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
