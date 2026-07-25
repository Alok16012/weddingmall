import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Clock, Store, TrendingUp, Users, Zap } from 'lucide-react'
import type { ReactNode } from 'react'
import { repositories } from '@/repositories'
import type { EnquiryStage } from '@/types/domain'
import { useSession } from '@/auth/SessionContext'
import { relativeTime } from '@/lib/format'
import { cn } from '@/lib/cn'
import { Badge } from '@/components/ui/Badge'
import { Button, buttonClasses } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/states'

const PIPELINE: { stage: EnquiryStage; label: string }[] = [
  { stage: 'new', label: 'New' },
  { stage: 'contacted', label: 'Contacted' },
  { stage: 'quoted', label: 'Quoted' },
  { stage: 'visit_scheduled', label: 'Visit' },
  { stage: 'won', label: 'Won' },
]

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
  const counts = (leads ?? []).reduce<Record<string, number>>((acc, l) => {
    acc[l.stage] = (acc[l.stage] ?? 0) + 1
    return acc
  }, {})
  const maxCount = Math.max(1, ...PIPELINE.map((p) => counts[p.stage] ?? 0))

  const onTarget =
    stats && stats.medianResponseMins <= stats.responseTargetMins

  return (
    <div>
      <header className="flex items-center justify-between px-4 py-4">
        <div>
          <p className="text-sm text-muted">Vendor workspace</p>
          <h1 className="text-2xl font-semibold text-ink">Usha Resort</h1>
        </div>
        <Badge tone="success">Approved</Badge>
      </header>

      <div className="space-y-5 px-4">
        {/* SLA banner */}
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <section
            className={cn(
              'rounded-[var(--radius-card)] p-4',
              onTarget ? 'bg-success-100' : 'bg-saffron-100',
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className={cn('h-5 w-5', onTarget ? 'text-success' : 'text-warning')} aria-hidden />
                <h2 className="font-semibold text-ink">Response SLA</h2>
              </div>
              <span className={cn('text-sm font-semibold', onTarget ? 'text-success' : 'text-warning')}>
                {onTarget ? 'On track' : 'Needs attention'}
              </span>
            </div>
            <div className="mt-3 flex items-end justify-between">
              <p className="tnum text-3xl font-semibold text-ink">
                {stats?.medianResponseMins}
                <span className="ml-1 text-base font-normal text-muted">min median</span>
              </p>
              <p className="tnum text-sm text-muted">target ≤ {stats?.responseTargetMins} min</p>
            </div>
            <SlaMeter value={stats?.medianResponseMins ?? 0} target={stats?.responseTargetMins ?? 10} good={!!onTarget} />
          </section>
        )}

        {/* KPI grid */}
        <div className="grid grid-cols-2 gap-3">
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
              <Kpi icon={<TrendingUp className="h-5 w-5" />} label="Response rate" value={`${stats?.responseRatePct ?? 0}%`} tone="success" />
              <Kpi icon={<Clock className="h-5 w-5" />} label="Upcoming" value={stats?.upcomingBookings ?? 0} />
              <Kpi icon={<Store className="h-5 w-5" />} label="Active listings" value={stats?.activeListings ?? 0} />
            </>
          )}
        </div>

        {/* Lead pipeline */}
        <section className="rounded-[var(--radius-card)] bg-surface p-4 shadow-[var(--shadow-card)]">
          <h2 className="mb-3 font-semibold text-ink">Lead pipeline</h2>
          <div className="space-y-2.5">
            {PIPELINE.map((p) => {
              const c = counts[p.stage] ?? 0
              return (
                <div key={p.stage} className="flex items-center gap-3">
                  <span className="w-20 shrink-0 text-sm text-muted">{p.label}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full gradient-primary transition-all"
                      style={{ width: `${(c / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="tnum w-6 shrink-0 text-right text-sm font-semibold text-ink">{c}</span>
                </div>
              )
            })}
          </div>
          <Link to="/vendor/leads" className="mt-3 flex items-center gap-1 text-sm font-semibold text-coral">
            Manage leads <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

        {/* Weekly views */}
        {!isLoading && stats && (
          <section className="rounded-[var(--radius-card)] bg-surface p-4 shadow-[var(--shadow-card)]">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-ink">Profile views · 7 days</h2>
              <span className="tnum text-sm font-semibold text-ink">
                {stats.weeklyViews.reduce((a, b) => a + b, 0)}
              </span>
            </div>
            <Sparkline data={stats.weeklyViews} />
          </section>
        )}

        {/* Leads needing response */}
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">Needs a response</h2>
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

function SlaMeter({ value, target, good }: { value: number; target: number; good: boolean }) {
  // Scale so the target sits at 70% of the track.
  const scale = (target / 0.7) || 1
  const pct = Math.min(100, (value / scale) * 100)
  return (
    <div className="relative mt-3 h-2 rounded-full bg-white">
      <div
        className={cn('h-full rounded-full', good ? 'bg-success' : 'bg-warning')}
        style={{ width: `${pct}%` }}
      />
      {/* target marker at 70% */}
      <div className="absolute top-1/2 h-3 w-0.5 -translate-y-1/2 bg-ink/40" style={{ left: '70%' }} />
    </div>
  )
}

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data, 1)
  const BAR_AREA = 72 // px available for the tallest bar
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  return (
    <div className="flex items-end justify-between gap-2">
      {data.map((v, i) => (
        <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1">
          <span className="tnum text-[10px] font-medium text-ink-soft">{v}</span>
          <div
            className="w-full rounded-t-md bg-coral/80 transition-all"
            style={{ height: Math.max(4, (v / max) * BAR_AREA) }}
            title={`${v} views`}
          />
          <span className="text-[10px] text-muted">{days[i]}</span>
        </div>
      ))}
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
