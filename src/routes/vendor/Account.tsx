import { useNavigate } from 'react-router-dom'
import { BadgeCheck, Bell, ChevronRight, LogOut, Heart, TrendingUp, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import { useSession } from '@/auth/SessionContext'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { BlinksAICredit } from '@/components/Brand'
import { ScreenHeader } from '@/components/layout/ScreenHeader'

export default function VendorAccount() {
  const { switchRole, signOut } = useSession()
  const navigate = useNavigate()

  return (
    <div>
      <ScreenHeader title="Business Account" />
      <div className="space-y-5 px-4">
        <section className="flex items-center gap-4 rounded-[var(--radius-card)] bg-surface p-4 shadow-[var(--shadow-card)]">
          <div className="grid h-16 w-16 place-items-center rounded-full gradient-primary text-2xl font-semibold text-white">U</div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-ink">Usha Resort</h2>
            <p className="text-sm text-muted">Patna · Venue</p>
          </div>
          <Badge tone="success"><BadgeCheck className="h-3.5 w-3.5" /> Verified</Badge>
        </section>

        <section className="rounded-[var(--radius-card)] bg-coral-100/60 p-4">
          <h3 className="mb-3 font-semibold text-ink">Profile health</h3>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat icon={<TrendingUp className="h-4 w-4" />} label="Response" value="92%" />
            <Stat icon={<Users className="h-4 w-4" />} label="Leads (30d)" value="24" />
            <Stat icon={<Heart className="h-4 w-4" />} label="Saves" value="88" />
          </div>
        </section>

        <section className="overflow-hidden rounded-[var(--radius-card)] bg-surface shadow-[var(--shadow-card)]">
          <Row icon={<BadgeCheck className="h-5 w-5" />} label="Verification & documents" />
          <Row icon={<Users className="h-5 w-5" />} label="Team members" />
          <Row icon={<Bell className="h-5 w-5" />} label="Notification preferences" />
        </section>

        <Button
          fullWidth
          variant="secondary"
          onClick={() => {
            switchRole('couple')
            navigate('/')
          }}
        >
          Switch to Couple mode
        </Button>
        <Button fullWidth variant="outline" leftIcon={<LogOut className="h-5 w-5" />} onClick={signOut}>
          Log out
        </Button>

        <div className="flex justify-center pb-4 pt-1">
          <BlinksAICredit />
        </div>
      </div>
    </div>
  )
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-field)] bg-surface p-3">
      <div className="mx-auto mb-1 grid h-8 w-8 place-items-center rounded-full bg-coral-100 text-coral">{icon}</div>
      <div className="tnum text-lg font-semibold text-ink">{value}</div>
      <div className="text-[11px] text-muted">{label}</div>
    </div>
  )
}

function Row({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <button className="tap flex w-full items-center gap-3 border-b border-line px-4 py-3.5 text-left last:border-0 hover:bg-surface-2">
      <span className="text-ink-soft">{icon}</span>
      <span className="flex-1 font-medium text-ink">{label}</span>
      <ChevronRight className="h-5 w-5 text-muted" aria-hidden />
    </button>
  )
}
