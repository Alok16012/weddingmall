import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Bell, BookOpen, Briefcase, ChevronRight, ClipboardList, Compass, FileText, Heart, LifeBuoy, LogOut,
  MapPin, MessagesSquare, PencilLine, Repeat, Share2, Shield, ShieldCheck, Store, UserSquare,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useSession } from '@/auth/SessionContext'
import { useEntry } from '@/auth/entry'
import { isNativeApp } from '@/lib/platform'
import { useCity } from '@/hooks/useCity'
import { useFavourites } from '@/hooks/useFavourites'
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications'
import { shareContent } from '@/lib/share'
import { resetOnboardingLocally } from '@/services/appState'
import { track } from '@/lib/analytics'
import { SHARE_TEXT, WEBSITE_URL, BRAND_NAME } from '@/config/company'
import { Logo, BlinksAICredit } from '@/components/Brand'
import { Button, buttonClasses } from '@/components/ui/Button'
import { ScreenHeader } from '@/components/layout/ScreenHeader'

export default function Profile() {
  const { isVendor, email, signOut } = useSession()
  const { city } = useCity()
  const { count } = useFavourites()
  const unread = useUnreadNotifications()
  const { entry, reset } = useEntry()
  const navigate = useNavigate()
  const [shareNote, setShareNote] = useState<string | null>(null)

  async function shareApp() {
    const outcome = await shareContent({
      title: BRAND_NAME,
      text: SHARE_TEXT,
      url: WEBSITE_URL,
    })
    track('share_app', { outcome, surface: 'more' })
    // Only the clipboard fallback needs saying out loud — the native sheet and
    // a dismissal are both self-evident to whoever just used them.
    setShareNote(
      outcome === 'copied'
        ? 'Link copied to your clipboard'
        : outcome === 'unavailable'
          ? `Sharing isn’t available here — the link is ${WEBSITE_URL}`
          : null,
    )
  }

  /** Back to the Guest / Vendor choice, ending any session along the way. */
  async function switchLogin() {
    reset()
    try {
      await signOut()
    } catch {
      /* Nothing to sign out of — the guest path never had a session. */
    }
    navigate('/welcome')
  }

  return (
    <div className="pb-6">
      <ScreenHeader title="More" />
      <div className="space-y-5 px-4">
        {/* Identity / vendor CTA */}
        {isVendor ? (
          <section className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[var(--color-primary)] text-white">
                <Store className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted">Signed in as vendor</p>
                <p className="truncate font-bold text-ink">{email}</p>
              </div>
            </div>
            <Link to="/vendor" className={buttonClasses({ fullWidth: true, className: 'mt-3' })}>
              Open vendor dashboard
            </Link>
          </section>
        ) : (
          <section className="rounded-[var(--radius-card)] border border-line bg-surface-2 p-4">
            <Logo className="mb-2" />
            {entry?.phoneVerified && entry.phone ? (
              <p className="flex items-center gap-1.5 text-sm text-ink-soft">
                <ShieldCheck className="h-4 w-4 shrink-0 text-success" aria-hidden />
                Browsing as guest ·{' '}
                <span className="tnum font-semibold text-ink">+91 {entry.phone}</span>
              </p>
            ) : (
              <p className="text-sm text-ink-soft">
                Browse and enquire freely — no account needed. Are you a wedding business?
              </p>
            )}
            <Link
              to="/vendor/login"
              className={buttonClasses({ variant: 'outline', fullWidth: true, className: 'mt-3' })}
            >
              <Store className="h-4 w-4" /> Vendor sign in
            </Link>
          </section>
        )}

        {/* Grouped so the menu reads as three jobs — where you are and what
            you've saved, the tools, and the app itself — rather than one list. */}
        <Group title="Planning">
          <Row to="/city" icon={<MapPin className="h-5 w-5" />} label="Location" value={city ?? 'All India'} />
          <Row to="/favourites" icon={<Heart className="h-5 w-5" />} label="Shortlist" value={count ? `${count}` : '—'} />
          <Row to="/bookings" icon={<ClipboardList className="h-5 w-5" />} label="My Bookings" />
          <Row to="/inbox" icon={<MessagesSquare className="h-5 w-5" />} label="Inbox" />
          <Row
            to="/notifications"
            icon={<Bell className="h-5 w-5" />}
            label="Notifications"
            value={unread ? `${unread} new` : undefined}
          />
        </Group>

        <Group title="Tools">
          <Row
            to="/biodata"
            icon={<UserSquare className="h-5 w-5" />}
            label="Free Biodata Maker"
            value="Free"
          />
          <Row to="/review" icon={<PencilLine className="h-5 w-5" />} label="Write a Review" />
          <Row to="/blogs" icon={<BookOpen className="h-5 w-5" />} label="Wedding Ideas & Inspiration" />
        </Group>

        <Group title="App">
          <ActionRow onClick={() => void shareApp()} icon={<Share2 className="h-5 w-5" />} label="Share App" />
          <ActionRow
            onClick={() => {
              resetOnboardingLocally()
              navigate('/')
            }}
            icon={<Compass className="h-5 w-5" />}
            label="Replay app tour"
          />
          <Row to="/contact" icon={<LifeBuoy className="h-5 w-5" />} label="Contact us" />
          <Row to="/careers" icon={<Briefcase className="h-5 w-5" />} label="Careers" />
          <Row to="/privacy" icon={<Shield className="h-5 w-5" />} label="Privacy & data" />
          <Row to="/legal/terms" icon={<FileText className="h-5 w-5" />} label="Terms of use" />
        </Group>

        {shareNote && (
          <p role="status" className="px-1 text-sm text-muted">
            {shareNote}
          </p>
        )}

        {isVendor && (
          <Button fullWidth variant="outline" leftIcon={<LogOut className="h-4 w-4" />} onClick={signOut}>
            Sign out
          </Button>
        )}

        {/* Only the installed app has a Guest / Vendor entry screen to go back to. */}
        {isNativeApp() && (
          <Button
            fullWidth
            variant="ghost"
            leftIcon={<Repeat className="h-4 w-4" />}
            onClick={() => void switchLogin()}
          >
            Switch login
          </Button>
        )}

        <div className="flex flex-col items-center gap-2 pt-2">
          <BlinksAICredit />
          <p className="text-[11px] text-muted">Same listings & enquiries as weddingmall.online</p>
        </div>
      </div>
    </div>
  )
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title}>
      <h2 className="mb-1.5 px-1 text-xs font-bold uppercase tracking-wide text-muted">{title}</h2>
      <div className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
        {children}
      </div>
    </section>
  )
}

const rowClasses =
  'tap flex w-full items-center gap-3 border-b border-line px-4 py-3.5 text-left last:border-0 hover:bg-surface-2'

function Row({
  to,
  icon,
  label,
  value,
}: {
  to: string
  icon: ReactNode
  label: string
  value?: string
}) {
  return (
    <Link to={to} className={rowClasses}>
      <span className="text-ink-soft">{icon}</span>
      <span className="flex-1 font-medium text-ink">{label}</span>
      {value && <span className="text-sm text-muted">{value}</span>}
      <ChevronRight className="h-5 w-5 text-muted" aria-hidden />
    </Link>
  )
}

/** Same row, but it performs an action instead of navigating. */
function ActionRow({
  onClick,
  icon,
  label,
}: {
  onClick: () => void
  icon: ReactNode
  label: string
}) {
  return (
    <button type="button" onClick={onClick} className={rowClasses}>
      <span className="text-ink-soft">{icon}</span>
      <span className="flex-1 font-medium text-ink">{label}</span>
      <ChevronRight className="h-5 w-5 text-muted" aria-hidden />
    </button>
  )
}
