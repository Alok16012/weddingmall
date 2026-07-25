import { useNavigate } from 'react-router-dom'
import {
  Bell,
  ChevronRight,
  HelpCircle,
  LogOut,
  Shield,
  Sparkles,
  Store,
  UserCog,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useSession } from '@/auth/SessionContext'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { BlinksAICredit } from '@/components/Brand'
import { ScreenHeader } from '@/components/layout/ScreenHeader'

export default function Profile() {
  const { user, switchRole, signOut } = useSession()
  const navigate = useNavigate()

  return (
    <div>
      <ScreenHeader title="Profile" />
      <div className="space-y-5 px-4">
        {/* Identity */}
        <section className="flex items-center gap-4 rounded-[var(--radius-card)] bg-surface p-4 shadow-[var(--shadow-card)]">
          <div className="grid h-16 w-16 place-items-center rounded-full gradient-primary text-2xl font-semibold text-white">
            {user?.displayName?.[0] ?? 'A'}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-ink">{user?.displayName}</h2>
            <p className="text-sm text-muted">{user?.city} · Couple</p>
          </div>
          <Badge tone="success">Verified</Badge>
        </section>

        {/* Wedding brief */}
        <section className="rounded-[var(--radius-card)] bg-coral-100/60 p-4">
          <div className="flex items-center gap-2 text-ink">
            <Sparkles className="h-5 w-5 text-coral" aria-hidden />
            <h3 className="font-semibold">Your Wedding Brief</h3>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <Stat label="Shortlisted" value="—" />
            <Stat label="Enquiries" value="1" />
            <Stat label="Bookings" value="1" />
          </div>
        </section>

        {/* Switch mode */}
        <Button
          fullWidth
          variant="secondary"
          leftIcon={<Store className="h-5 w-5" />}
          onClick={() => {
            switchRole('vendor')
            navigate('/vendor')
          }}
        >
          Switch to Vendor mode
        </Button>

        {/* Settings list */}
        <section className="overflow-hidden rounded-[var(--radius-card)] bg-surface shadow-[var(--shadow-card)]">
          <Row icon={<UserCog className="h-5 w-5" />} label="Account settings" onClick={() => navigate('/privacy')} />
          <Row icon={<Bell className="h-5 w-5" />} label="Notifications" onClick={() => navigate('/privacy')} />
          <Row icon={<Shield className="h-5 w-5" />} label="Privacy & permissions" onClick={() => navigate('/privacy')} />
          <Row icon={<HelpCircle className="h-5 w-5" />} label="Help & support" onClick={() => navigate('/privacy')} />
        </section>

        <Button fullWidth variant="outline" leftIcon={<LogOut className="h-5 w-5" />} onClick={signOut}>
          Log out
        </Button>

        <div className="flex justify-center pb-4 pt-2">
          <BlinksAICredit />
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-field)] bg-surface p-3">
      <div className="tnum text-xl font-semibold text-ink">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  )
}

function Row({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="tap flex w-full items-center gap-3 border-b border-line px-4 py-3.5 text-left last:border-0 hover:bg-surface-2"
    >
      <span className="text-ink-soft">{icon}</span>
      <span className="flex-1 font-medium text-ink">{label}</span>
      <ChevronRight className="h-5 w-5 text-muted" aria-hidden />
    </button>
  )
}
