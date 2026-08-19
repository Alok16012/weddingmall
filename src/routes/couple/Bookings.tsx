import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, ClipboardList, Users } from 'lucide-react'
import { BOOKING_STATUS_LABELS, type Booking, type BookingStatus } from '@/types/domain'
import { listMyBookings } from '@/services/bookings'
import { useCapability } from '@/hooks/useCapability'
import { useSession } from '@/auth/SessionContext'
import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/states'
import { BackendSetupNotice } from '@/components/BackendSetupNotice'
import { buttonClasses } from '@/components/ui/Button'
import { cn } from '@/lib/cn'

/**
 * My Bookings — the enquiry → booking pipeline for the signed-in customer.
 *
 * The first state is "Enquiry Sent" and only the vendor can advance it, so a
 * sent enquiry is never dressed up as a confirmed booking. The status rail
 * below makes the distance between the two explicit.
 */

/** Order of the customer-visible pipeline; `cancelled` sits outside it. */
const FLOW: BookingStatus[] = [
  'enquiry_sent',
  'vendor_responded',
  'tentative',
  'confirmed',
  'completed',
]

const TONE: Record<BookingStatus, string> = {
  enquiry_sent: 'bg-surface-2 text-ink-soft',
  vendor_responded: 'bg-[var(--color-primary-100)] text-[var(--color-primary)]',
  tentative: 'bg-[var(--color-accent)] text-ink',
  confirmed: 'bg-success text-white',
  completed: 'bg-success-100 text-success',
  cancelled: 'bg-surface-2 text-muted',
}

export default function Bookings() {
  const enabled = useCapability('bookings')
  // Any auth session counts — a guest who verified their mobile has one.
  const { userId } = useSession()

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['bookings', 'mine'],
    queryFn: listMyBookings,
    enabled: enabled === true,
    retry: false,
  })

  return (
    <div className="pb-6">
      <ScreenHeader title="My Bookings" subtitle="Enquiries and bookings you've made" />

      {enabled === undefined && (
        <div className="space-y-3 px-4 pt-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[132px] w-full" />
          ))}
        </div>
      )}

      {enabled === false && (
        <BackendSetupNotice feature="Booking history">
          <Link to="/venues" className={buttonClasses({ size: 'sm' })}>
            Browse venues
          </Link>
        </BackendSetupNotice>
      )}

      {enabled === true && (
        <div className="space-y-3 px-4 pt-4">
          {isLoading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-[132px] w-full" />)}
          {isError && <ErrorState onRetry={() => refetch()} message={(error as Error)?.message} />}

          {!isLoading && !isError && !userId && (
            <EmptyState
              icon={<ClipboardList className="h-7 w-7" />}
              title="Verify your mobile to track bookings"
              description="Bookings are tied to your account so they follow you across the website and both apps."
              action={
                <Link to="/welcome/verify" className={buttonClasses({ size: 'sm' })}>
                  Verify mobile
                </Link>
              }
            />
          )}

          {!isLoading && !isError && userId && data?.length === 0 && (
            <EmptyState
              icon={<ClipboardList className="h-7 w-7" />}
              title="No enquiries yet"
              description="Send an enquiry to a venue or vendor and you'll be able to track it here."
              action={
                <Link to="/venues" className={buttonClasses({ size: 'sm' })}>
                  Browse venues
                </Link>
              }
            />
          )}

          {data?.map((b) => <BookingCard key={b.id} booking={b} />)}
        </div>
      )}
    </div>
  )
}

function BookingCard({ booking }: { booking: Booking }) {
  const stage = FLOW.indexOf(booking.status)

  return (
    <article className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-bold text-ink">{booking.vendorName ?? 'Listing'}</h3>
          <p className="tnum mt-0.5 text-xs text-muted">Ref {booking.reference}</p>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-[var(--radius-pill)] px-2.5 py-1 text-[11px] font-bold',
            TONE[booking.status],
          )}
        >
          {BOOKING_STATUS_LABELS[booking.status]}
        </span>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-soft">
        {booking.eventDate && (
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" aria-hidden />
            <span className="tnum">{booking.eventDate}</span>
          </span>
        )}
        {booking.eventType && <span>{booking.eventType}</span>}
        {booking.guestCount != null && (
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-4 w-4" aria-hidden />
            <span className="tnum">{booking.guestCount} guests</span>
          </span>
        )}
      </div>

      {/* Progress rail. Position is shown by fill AND by the labelled current
          step, so the state never depends on colour alone. */}
      {booking.status !== 'cancelled' && (
        <div className="mt-3">
          <div className="flex gap-1" role="presentation">
            {FLOW.map((s, i) => (
              <span
                key={s}
                className={cn(
                  'h-1 flex-1 rounded-full',
                  i <= stage ? 'bg-[var(--color-primary)]' : 'bg-line',
                )}
              />
            ))}
          </div>
          <p className="mt-1.5 text-xs text-muted">
            Step {stage + 1} of {FLOW.length} · {BOOKING_STATUS_LABELS[booking.status]}
          </p>
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <Link
          to={`/vendor/${booking.vendorId}`}
          className={buttonClasses({ variant: 'outline', size: 'sm' })}
        >
          View listing
        </Link>
        <Link to="/inbox" className={buttonClasses({ variant: 'ghost', size: 'sm' })}>
          Messages
        </Link>
      </div>

      {booking.paymentState && (
        <p className="mt-2 text-xs text-muted">Payment: {booking.paymentState}</p>
      )}
    </article>
  )
}
