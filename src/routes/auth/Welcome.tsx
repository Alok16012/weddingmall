import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronRight, Heart, Store, UserRound } from 'lucide-react'
import { useEntry } from '@/auth/entry'
import { BlinksAICredit, LogoMark, Wordmark } from '@/components/Brand'

/**
 * First screen of the installed app: Guest or Vendor.
 *
 * Guests go on to mobile verification; vendors go to the existing email
 * sign-in. The choice is remembered, so this is a first-launch screen rather
 * than a login wall — it is not shown again unless the person switches from
 * the More tab.
 */
export default function Welcome() {
  const navigate = useNavigate()
  const location = useLocation()
  const { choose } = useEntry()

  /** Where the gate wanted to send them before it stopped here. */
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  function asVendor() {
    // Recorded before the sign-in screen so that backing out of it leaves them
    // in the app rather than bouncing straight back to this screen.
    choose({ choice: 'vendor', phone: null, phoneVerified: false })
    navigate('/vendor/login')
  }

  return (
    <div className="flex min-h-[100svh] flex-col px-6 pb-8 pt-14">
      <div className="flex flex-col items-center text-center">
        <LogoMark className="h-16 w-16" />
        <Wordmark className="mt-3 text-[1.6rem] text-[var(--color-primary)]" />
        <p className="mt-1 text-sm text-muted">India&apos;s Wedding Marketplace</p>
      </div>

      <h1 className="mt-9 text-center text-xl font-bold text-ink">How would you like to continue?</h1>

      <div className="mt-5 space-y-3">
        <ChoiceCard
          onClick={() => navigate('/welcome/verify', { state: { from } })}
          icon={<UserRound className="h-6 w-6" aria-hidden />}
          title="Guest Login"
          body="Browse venues and vendors, shortlist favourites and send enquiries. No account needed."
          primary
        />
        <ChoiceCard
          onClick={asVendor}
          icon={<Store className="h-6 w-6" aria-hidden />}
          title="Vendor Login"
          body="Registered a business on WeddingMall.Online? Sign in to manage your enquiries."
        />
      </div>

      <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-xs text-muted">
        <Heart className="h-3.5 w-3.5 text-[var(--color-primary)]" aria-hidden />
        Free to use — you only pay the vendors you book.
      </p>

      <div className="mt-auto pt-8 text-center">
        <BlinksAICredit />
      </div>
    </div>
  )
}

function ChoiceCard({
  onClick,
  icon,
  title,
  body,
  primary = false,
}: {
  onClick: () => void
  icon: React.ReactNode
  title: string
  body: string
  primary?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={
        'pressable tap flex w-full items-start gap-3.5 rounded-[var(--radius-card)] border p-4 text-left ' +
        (primary
          ? 'border-[var(--color-primary)] bg-[var(--color-primary-100)] elevate-2'
          : 'border-line bg-surface elevate-1')
      }
    >
      <span
        className={
          'grid h-12 w-12 shrink-0 place-items-center rounded-full ' +
          (primary ? 'bg-[var(--color-primary)] text-white' : 'bg-surface-2 text-[var(--color-primary)]')
        }
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1 font-bold text-ink">
          {title}
          <ChevronRight className="h-4 w-4 text-muted" aria-hidden />
        </span>
        <span className="mt-0.5 block text-[13px] leading-snug text-ink-soft">{body}</span>
      </span>
    </button>
  )
}
