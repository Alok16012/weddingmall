import { Link, useNavigate } from 'react-router-dom'
import {
  BookOpen, Briefcase, ChevronRight, FileText, Heart, LogOut, MapPin, Repeat, Shield, ShieldCheck,
  Store, UserSquare,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useSession } from '@/auth/SessionContext'
import { useEntry } from '@/auth/entry'
import { isNativeApp } from '@/lib/platform'
import { useCity } from '@/hooks/useCity'
import { useFavourites } from '@/hooks/useFavourites'
import { Logo, BlinksAICredit } from '@/components/Brand'
import { Button, buttonClasses } from '@/components/ui/Button'
import { ScreenHeader } from '@/components/layout/ScreenHeader'

export default function Profile() {
  const { isVendor, email, signOut } = useSession()
  const { city } = useCity()
  const { count } = useFavourites()
  const { entry, reset } = useEntry()
  const navigate = useNavigate()

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

        {/* Quick links */}
        <section className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
          <Row to="/city" icon={<MapPin className="h-5 w-5" />} label="Location" value={city ?? 'All India'} />
          <Row to="/favourites" icon={<Heart className="h-5 w-5" />} label="Shortlist" value={count ? `${count}` : '—'} />
          <Row
            to="/biodata"
            icon={<UserSquare className="h-5 w-5" />}
            label="Free Biodata maker"
            value="Free"
          />
          <Row to="/blogs" icon={<BookOpen className="h-5 w-5" />} label="Wedding ideas" />
          <Row to="/careers" icon={<Briefcase className="h-5 w-5" />} label="Careers" />
        </section>

        {/* Legal */}
        <section className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
          <Row to="/privacy" icon={<Shield className="h-5 w-5" />} label="Privacy & data" />
          <Row to="/legal/terms" icon={<FileText className="h-5 w-5" />} label="Terms of use" />
        </section>

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
    <Link
      to={to}
      className="tap flex w-full items-center gap-3 border-b border-line px-4 py-3.5 last:border-0 hover:bg-surface-2"
    >
      <span className="text-ink-soft">{icon}</span>
      <span className="flex-1 font-medium text-ink">{label}</span>
      {value && <span className="text-sm text-muted">{value}</span>}
      <ChevronRight className="h-5 w-5 text-muted" aria-hidden />
    </Link>
  )
}
