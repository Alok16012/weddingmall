import { Link, Navigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Bell, CalendarDays, Images, LogOut, MessageSquare, Star, TrendingUp } from 'lucide-react'
import type { ReactNode } from 'react'
import { useSession } from '@/auth/SessionContext'
import { getMyVendor } from '@/services/vendors'
import { listLeadsForVendor } from '@/services/leads'
import { listVendorBookings, updateBookingStatus } from '@/services/bookings'
import { useCapability } from '@/hooks/useCapability'
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications'
import { track } from '@/lib/analytics'
import { BOOKING_STATUSES, BOOKING_STATUS_LABELS, categoryLabel, type BookingStatus } from '@/types/domain'
import { Badge } from '@/components/ui/Badge'
import { Button, buttonClasses } from '@/components/ui/Button'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/states'
import { LeadRow } from '@/components/LeadRow'
import { ScreenHeader } from '@/components/layout/ScreenHeader'

/**
 * Vendor workspace. Every number here comes from real rows — the vendor's own
 * `vendors` record and their `leads`. No invented analytics.
 */
export default function VendorDashboard() {
  const { email, isVendor, initializing, signOut } = useSession()
  const availability = useCapability('availability')
  const unread = useUnreadNotifications()

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

  if (initializing) {
    return (
      <div>
        <ScreenHeader title="Vendor workspace" />
        <div className="p-4"><Skeleton className="h-32 w-full" /></div>
      </div>
    )
  }
  if (!isVendor) return <Navigate to="/vendor/login" replace />

  const leads = leadsQ.data ?? []
  const newLeads = leads.filter((l) => (l.status ?? 'new').toLowerCase() === 'new')

  return (
    <div className="pb-4">
      <ScreenHeader
        title={vendorQ.isLoading ? 'Loading…' : (vendor?.name ?? 'Your business')}
        subtitle="Vendor workspace"
        right={vendor && (
          <Badge tone={vendor.status === 'active' ? 'success' : 'saffron'}>{vendor.status}</Badge>
        )}
      />

      <div className="space-y-5 px-4 pt-4">
        {vendorQ.isLoading && <Skeleton className="h-24 w-full" />}
        {vendorQ.isError && <ErrorState onRetry={() => vendorQ.refetch()} />}

        {/* No matching vendor row for this login */}
        {!vendorQ.isLoading && !vendor && (
          <EmptyState
            title="No vendor profile linked"
            description={`We couldn't find a vendor record for ${email}. Please contact Wedding Mall support to link your account.`}
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

            {unread > 0 && (
              <Link
                to="/notifications"
                className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--color-primary)] bg-[var(--color-primary-100)] p-4"
              >
                <Bell className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
                <span className="flex-1 font-semibold text-[var(--color-primary)]">
                  {unread} unread notification{unread === 1 ? '' : 's'}
                </span>
                <ArrowRight className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
              </Link>
            )}

            {/* Date availability. Hidden entirely when the backend cannot store
                it — a calendar that silently forgets is worse than none. */}
            {availability === true && (
              <Link
                to="/vendor/availability"
                className="flex items-center gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4"
              >
                <CalendarDays className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
                <span className="flex-1">
                  <span className="block font-bold text-ink">Manage Booking Date</span>
                  <span className="block text-sm text-muted">
                    Mark dates available, on hold, confirmed or blocked
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 text-muted" aria-hidden />
              </Link>
            )}

            {/* Recent leads */}
            <section>
              <div className="flex items-center justify-between">
                <h2 className="text-xl text-ink">Recent enquiries</h2>
                <Link
                  to="/vendor/leads"
                  className="-my-2 -mr-2 flex min-h-11 items-center px-2 text-sm font-semibold text-[var(--color-primary)]"
                >
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

            {/* Bookings pipeline — vendor-side status control */}
            <VendorBookings vendorId={vendor.id} />

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

/**
 * The bookings the vendor has to act on.
 *
 * The status control here is the only thing that can move a record past
 * "Enquiry Sent" — the customer's own screen can never advance it — which is
 * what keeps an enquiry from being presented as a confirmed booking.
 */
function VendorBookings({ vendorId }: { vendorId: string }) {
  const enabled = useCapability('bookings')
  const queryClient = useQueryClient()

  const q = useQuery({
    queryKey: ['vendor-bookings', vendorId],
    queryFn: () => listVendorBookings(vendorId),
    enabled: enabled === true,
    retry: false,
  })

  const change = useMutation({
    mutationFn: ({ id, status }: { id: string; status: BookingStatus }) =>
      updateBookingStatus(id, status),
    onSuccess: (_r, vars) => {
      track('booking_status_changed', {
        booking_id: vars.id,
        vendor_id: vendorId,
        status: vars.status,
        actor: 'vendor',
      })
      void queryClient.invalidateQueries({ queryKey: ['vendor-bookings', vendorId] })
    },
  })

  // Nothing to show until the backend can actually store bookings.
  if (enabled !== true) return null

  const rows = q.data ?? []

  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="text-xl text-ink">Bookings</h2>
        <Link
          to="/vendor/availability"
          className="-my-2 -mr-2 flex min-h-11 items-center px-2 text-sm font-semibold text-[var(--color-primary)]"
        >
          Calendar
        </Link>
      </div>
      <div className="mt-3 space-y-3">
        {q.isLoading && <Skeleton className="h-24 w-full" />}
        {q.isError && <ErrorState onRetry={() => q.refetch()} message={(q.error as Error)?.message} />}
        {!q.isLoading && !q.isError && rows.length === 0 && (
          <p className="rounded-[var(--radius-card)] border border-line bg-surface p-4 text-sm text-muted">
            No bookings yet. Every enquiry with an account behind it opens one here.
          </p>
        )}
        {rows.slice(0, 6).map((b) => (
          <article key={b.id} className="rounded-[var(--radius-card)] border border-line bg-surface p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink">{b.contactName ?? 'Customer'}</p>
                <p className="tnum text-xs text-muted">
                  Ref {b.reference}
                  {b.eventDate && ` · ${b.eventDate}`}
                  {b.guestCount != null && ` · ${b.guestCount} guests`}
                </p>
              </div>
              <Badge tone={b.status === 'confirmed' ? 'success' : 'saffron'}>
                {BOOKING_STATUS_LABELS[b.status]}
              </Badge>
            </div>
            <label className="mt-2.5 block">
              <span className="sr-only">Booking status for {b.reference}</span>
              <select
                value={b.status}
                disabled={change.isPending}
                onChange={(e) => change.mutate({ id: b.id, status: e.target.value as BookingStatus })}
                className="w-full rounded-[var(--radius-field)] border border-line bg-surface-2 px-3 py-2 text-sm text-ink"
              >
                {BOOKING_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {BOOKING_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </label>
          </article>
        ))}
      </div>
    </section>
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
