import { Link, Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Images, LogOut, MessageSquare, Star, TrendingUp } from 'lucide-react'
import type { ReactNode } from 'react'
import { useSession } from '@/auth/SessionContext'
import { getMyVendor } from '@/services/vendors'
import { listLeadsForVendor } from '@/services/leads'
import { categoryLabel } from '@/types/domain'
import { Badge } from '@/components/ui/Badge'
import { Button, buttonClasses } from '@/components/ui/Button'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/states'
import { LeadRow } from '@/components/LeadRow'

/**
 * Vendor workspace. Every number here comes from real rows — the vendor's own
 * `vendors` record and their `leads`. No invented analytics.
 */
export default function VendorDashboard() {
  const { email, isVendor, initializing, signOut } = useSession()

  const vendorQ = useQuery({
    queryKey: ['my-vendor', email],
    queryFn: () => getMyVendor(email!),
    enabled: !!email,
  })
  const vendor = vendorQ.data

  const leadsQ = useQuery({
    queryKey: ['my-leads', vendor?.id],
    queryFn: () => listLeadsForVendor(vendor!.id),
    enabled: !!vendor?.id,
  })

  if (initializing) return <div className="p-4"><Skeleton className="h-32 w-full" /></div>
  if (!isVendor) return <Navigate to="/vendor/login" replace />

  const leads = leadsQ.data ?? []
  const newLeads = leads.filter((l) => (l.status ?? 'new').toLowerCase() === 'new')

  return (
    <div className="pb-4">
      <header className="flex items-start justify-between gap-3 px-4 py-4">
        <div className="min-w-0">
          <p className="text-sm text-muted">Vendor workspace</p>
          <h1 className="truncate text-[1.6rem] text-ink">
            {vendorQ.isLoading ? 'Loading…' : (vendor?.name ?? 'Your business')}
          </h1>
        </div>
        {vendor && (
          <Badge tone={vendor.status === 'active' ? 'success' : 'saffron'}>{vendor.status}</Badge>
        )}
      </header>

      <div className="space-y-5 px-4">
        {vendorQ.isLoading && <Skeleton className="h-24 w-full" />}
        {vendorQ.isError && <ErrorState onRetry={() => vendorQ.refetch()} />}

        {/* No matching vendor row for this login */}
        {!vendorQ.isLoading && !vendor && (
          <EmptyState
            title="No vendor profile linked"
            description={`We couldn't find a vendor record for ${email}. Please contact WeddingMall support to link your account.`}
            action={<Button variant="outline" size="sm" onClick={signOut}>Sign out</Button>}
          />
        )}

        {vendor && (
          <>
            {/* KPIs — all real */}
            <div className="grid grid-cols-3 gap-3">
              <Kpi icon={<MessageSquare className="h-5 w-5" />} label="Total leads" value={leads.length} />
              <Kpi icon={<TrendingUp className="h-5 w-5" />} label="New" value={newLeads.length} tone="primary" />
              <Kpi
                icon={<Star className="h-5 w-5" />}
                label="Rating"
                value={vendor.rating != null ? vendor.rating.toFixed(1) : '—'}
              />
            </div>

            {/* Listing summary */}
            <section className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
              <div className="flex gap-3 p-3">
                {vendor.image ? (
                  <img src={vendor.image} alt="" className="h-20 w-20 shrink-0 rounded-[var(--radius-field)] object-cover" />
                ) : (
                  <div className="grid h-20 w-20 shrink-0 place-items-center rounded-[var(--radius-field)] bg-surface-2 text-muted">
                    <Images className="h-6 w-6" aria-hidden />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted">{vendor.location ?? 'Location not set'}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {vendor.category.slice(0, 3).map((c) => (
                      <span key={c} className="rounded-[var(--radius-pill)] bg-surface-2 px-2 py-0.5 text-[11px] text-ink-soft">
                        {categoryLabel(c)}
                      </span>
                    ))}
                  </div>
                  <p className="tnum mt-1 text-xs text-muted">{vendor.images.length} photos</p>
                </div>
              </div>
              <Link
                to={`/vendor/${vendor.id}`}
                className="flex items-center justify-center gap-1 border-t border-line py-2.5 text-sm font-semibold text-[var(--color-primary)]"
              >
                View public listing <ArrowRight className="h-4 w-4" />
              </Link>
            </section>

            {/* Recent leads */}
            <section>
              <div className="flex items-center justify-between">
                <h2 className="text-xl text-ink">Recent enquiries</h2>
                <Link to="/vendor/leads" className="text-sm font-semibold text-[var(--color-primary)]">
                  View all
                </Link>
              </div>
              <div className="mt-3 space-y-3">
                {leadsQ.isLoading && <Skeleton className="h-24 w-full" />}
                {!leadsQ.isLoading && leads.length === 0 && (
                  <p className="rounded-[var(--radius-card)] border border-line bg-surface p-4 text-sm text-muted">
                    No enquiries yet. They appear here the moment a customer submits one from the app
                    or the website.
                  </p>
                )}
                {leads.slice(0, 3).map((l) => (
                  <LeadRow key={l.id} lead={l} />
                ))}
              </div>
            </section>

            <Link to="/vendor/leads" className={buttonClasses({ fullWidth: true })}>
              Manage all enquiries
            </Link>
          </>
        )}

        <Button fullWidth variant="outline" leftIcon={<LogOut className="h-4 w-4" />} onClick={signOut}>
          Sign out
        </Button>
      </div>
    </div>
  )
}

function Kpi({
  icon,
  label,
  value,
  tone = 'neutral',
}: {
  icon: ReactNode
  label: string
  value: ReactNode
  tone?: 'neutral' | 'primary'
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-surface p-3">
      <span className={tone === 'primary' ? 'text-[var(--color-primary)]' : 'text-muted'}>{icon}</span>
      <div className="tnum mt-1.5 text-xl font-bold text-ink">{value}</div>
      <div className="text-[11px] text-muted">{label}</div>
    </div>
  )
}
