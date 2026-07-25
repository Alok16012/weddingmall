import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CalendarCheck, MessageSquare } from 'lucide-react'
import { repositories } from '@/repositories'
import { formatINR, relativeTime } from '@/lib/format'
import { cn } from '@/lib/cn'
import { Badge } from '@/components/ui/Badge'
import { EmptyState, Skeleton } from '@/components/ui/states'
import { buttonClasses } from '@/components/ui/Button'
import { ScreenHeader } from '@/components/layout/ScreenHeader'
import type { BookingStatus } from '@/types/domain'

const statusTone: Record<BookingStatus, 'success' | 'saffron' | 'muted' | 'coral'> = {
  requested: 'saffron',
  confirmed: 'success',
  declined: 'muted',
  completed: 'muted',
  cancelled: 'muted',
}

export default function Bookings() {
  const [tab, setTab] = useState<'enquiries' | 'bookings'>('enquiries')

  const { data: enquiries, isLoading: loadingEnq } = useQuery({
    queryKey: ['enquiries', 'couple'],
    queryFn: () => repositories.enquiries.listForCouple(),
  })
  const { data: bookings, isLoading: loadingBk } = useQuery({
    queryKey: ['bookings', 'couple'],
    queryFn: () => repositories.bookings.listForCouple(),
  })

  return (
    <div>
      <ScreenHeader title="Enquiries & Bookings" />
      <div className="px-4">
        <div className="flex rounded-[var(--radius-pill)] bg-surface-2 p-1">
          {(['enquiries', 'bookings'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'tap flex-1 rounded-[var(--radius-pill)] py-2 text-sm font-semibold capitalize transition',
                tab === t ? 'bg-surface text-ink shadow-[var(--shadow-card)]' : 'text-muted',
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 px-4 pt-4">
        {tab === 'enquiries' && (
          <>
            {loadingEnq && <Skeleton className="h-28 w-full" />}
            {!loadingEnq && (enquiries?.length ?? 0) === 0 && (
              <EmptyState
                icon={<MessageSquare className="h-7 w-7" />}
                title="No enquiries yet"
                description="Send an enquiry to a vendor and track the conversation here."
                action={<Link to="/explore" className={buttonClasses({ size: 'sm' })}>Explore vendors</Link>}
              />
            )}
            {enquiries?.map((e) => (
              <Link
                key={e.id}
                to="/chat/cnv1"
                className="block rounded-[var(--radius-card)] bg-surface p-4 shadow-[var(--shadow-card)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-ink">{e.vendorName}</h3>
                  <Badge tone="saffron">{e.stage}</Badge>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted">{e.message}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted">
                  {e.guests && <span className="tnum">{e.guests} guests</span>}
                  {e.budget && <span className="tnum">Budget {formatINR(e.budget.minorUnits, { compact: true })}</span>}
                  <span className="ml-auto">{relativeTime(e.createdAt)}</span>
                </div>
              </Link>
            ))}
          </>
        )}

        {tab === 'bookings' && (
          <>
            {loadingBk && <Skeleton className="h-28 w-full" />}
            {!loadingBk && (bookings?.length ?? 0) === 0 && (
              <EmptyState
                icon={<CalendarCheck className="h-7 w-7" />}
                title="No bookings yet"
                description="Your confirmed bookings and their timeline appear here."
              />
            )}
            {bookings?.map((b) => (
              <div key={b.id} className="rounded-[var(--radius-card)] bg-surface p-4 shadow-[var(--shadow-card)]">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-ink">{b.listingTitle}</h3>
                  <Badge tone={statusTone[b.status]}>{b.status}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted">{b.packageSnapshot.name}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="tnum text-sm text-ink-soft">
                    {new Date(b.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <span className="tnum font-semibold text-ink">{formatINR(b.packageSnapshot.price.minorUnits)}</span>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
