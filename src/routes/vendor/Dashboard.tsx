import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Clock, Store, TrendingUp, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import { repositories } from '@/repositories'
import { useSession } from '@/auth/SessionContext'
import { relativeTime } from '@/lib/format'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { buttonClasses } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/states'

export default function VendorDashboard() {
  const { switchRole } = useSession()
  const navigate = useNavigate()

  const { data: stats, isLoading } = useQuery({
    queryKey: ['vendor', 'stats'],
    queryFn: () => repositories.vendor.stats(),
  })
  const { data: leads } = useQuery({
    queryKey: ['vendor', 'leads'],
    queryFn: () => repositories.enquiries.listForVendor(),
  })

  const freshLeads = (leads ?? []).filter((l) => l.stage === 'new')

  return (
    <div>
      <header className="flex items-center justify-between px-4 py-4">
        <div>
          <p className="text-sm text-muted">Vendor workspace</p>
          <h1 className="text-2xl font-semibold text-ink">Usha Resort</h1>
        </div>
        <Badge tone="success">Approved</Badge>
      </header>

      <div className="grid grid-cols-2 gap-3 px-4">
        {isLoading ? (
          <>
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </>
        ) : (
          <>
            <Kpi icon={<Users className="h-5 w-5" />} label="New leads" value={stats?.newLeads ?? 0} tone="coral" />
            <Kpi icon={<Clock className="h-5 w-5" />} label="Median response" value={`${stats?.medianResponseMins ?? 0}m`} />
            <Kpi icon={<TrendingUp className="h-5 w-5" />} label="Response rate" value={`${stats?.responseRatePct ?? 0}%`} tone="success" />
            <Kpi icon={<Store className="h-5 w-5" />} label="Active listings" value={stats?.activeListings ?? 0} />
          </>
        )}
      </div>

      <section className="mt-6 px-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Leads needing a response</h2>
          <Link to="/vendor/leads" className="text-sm font-semibold text-coral">View all</Link>
        </div>
        <div className="mt-3 space-y-3">
          {freshLeads.length === 0 && <p className="text-sm text-muted">You’re all caught up. 🎉</p>}
          {freshLeads.map((l) => (
            <div key={l.id} className="rounded-[var(--radius-card)] bg-surface p-4 shadow-[var(--shadow-card)]">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-ink">{l.coupleName}</h3>
                  <p className="text-sm text-muted">
                    {l.guests ? `${l.guests} guests · ` : ''}
                    {l.eventDate}
                  </p>
                </div>
                <Badge tone="saffron">SLA · {relativeTime(l.createdAt)}</Badge>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{l.message}</p>
              <Link to="/vendor/leads" className={buttonClasses({ size: 'sm', fullWidth: true, className: 'mt-3' })}>
                Respond now <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-6 px-4">
        <Button
          fullWidth
          variant="outline"
          onClick={() => {
            switchRole('couple')
            navigate('/')
          }}
        >
          Switch to Couple mode
        </Button>
      </div>
    </div>
  )
}

function Kpi({ icon, label, value, tone = 'neutral' }: { icon: ReactNode; label: string; value: ReactNode; tone?: 'neutral' | 'coral' | 'success' }) {
  const toneClass = tone === 'coral' ? 'text-coral' : tone === 'success' ? 'text-success' : 'text-ink'
  return (
    <div className="rounded-[var(--radius-card)] bg-surface p-4 shadow-[var(--shadow-card)]">
      <span className={toneClass}>{icon}</span>
      <div className="tnum mt-2 text-2xl font-semibold text-ink">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  )
}
