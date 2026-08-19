import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, TriangleAlert } from 'lucide-react'
import {
  AVAILABILITY_LABELS,
  AVAILABILITY_STATUSES,
  type AvailabilityStatus,
} from '@/types/domain'
import { getMyVendor } from '@/services/vendors'
import { listAvailability, listVendorBookings, setAvailability, setAvailabilityRange } from '@/services/bookings'
import { useCapability } from '@/hooks/useCapability'
import { useSession } from '@/auth/SessionContext'
import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { BackendSetupNotice } from '@/components/BackendSetupNotice'
import { ErrorState, Skeleton } from '@/components/ui/states'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'

/**
 * Manage Booking Date — the vendor's own calendar.
 *
 * Every cell is a real `vendor_availability` row. The five states are the ones
 * the schema allows, and the `(vendor_id, date)` unique constraint is what
 * actually prevents a double booking; this screen additionally refuses to
 * overwrite a confirmed date without a second, explicit tap, so a busy day is
 * never given away by accident.
 */

/** Short code shown inside the cell: state is never signalled by colour alone. */
const CODE: Record<AvailabilityStatus, string> = {
  available: 'A',
  enquiry_received: 'E',
  tentative: 'T',
  confirmed: 'C',
  blocked: 'B',
}

const SWATCH: Record<AvailabilityStatus, string> = {
  available: 'bg-success-100 text-success',
  enquiry_received: 'bg-[var(--color-primary-100)] text-[var(--color-primary)]',
  tentative: 'bg-[var(--color-accent)] text-ink',
  confirmed: 'bg-success text-white',
  blocked: 'bg-surface-2 text-muted line-through',
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

const pad = (n: number) => String(n).padStart(2, '0')
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`
const monthLabel = (y: number, m: number) =>
  new Date(y, m, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
const dayLabel = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

export default function VendorAvailability() {
  const { email, isVendor, initializing } = useSession()
  const enabled = useCapability('availability')
  const queryClient = useQueryClient()

  const today = new Date()
  const [cursor, setCursor] = useState({ y: today.getFullYear(), m: today.getMonth() })
  const [selected, setSelected] = useState<string | null>(null)
  const [rangeStart, setRangeStart] = useState<string | null>(null)
  const [rangeEnd, setRangeEnd] = useState<string | null>(null)
  const [mode, setMode] = useState<'single' | 'range'>('single')
  const [note, setNote] = useState('')
  const [override, setOverride] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const vendorQ = useQuery({
    queryKey: ['my-vendor', email],
    queryFn: () => getMyVendor(email!),
    enabled: !!email,
  })
  const vendor = vendorQ.data

  const from = iso(cursor.y, cursor.m, 1)
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate()
  const to = iso(cursor.y, cursor.m, daysInMonth)

  const daysQ = useQuery({
    queryKey: ['availability', vendor?.id, from],
    queryFn: () => listAvailability(vendor!.id, from, to),
    enabled: enabled === true && !!vendor?.id,
    retry: false,
  })

  // Bookings give the calendar its context: which dates already carry a real
  // enquiry or a confirmed event, straight from the `bookings` table.
  const bookingsEnabled = useCapability('bookings')
  const bookingsQ = useQuery({
    queryKey: ['vendor-bookings', vendor?.id],
    queryFn: () => listVendorBookings(vendor!.id),
    enabled: bookingsEnabled === true && !!vendor?.id,
    retry: false,
  })

  const marks = useMemo(() => {
    const map = new Map<string, { status: AvailabilityStatus; note: string | null }>()
    for (const d of daysQ.data ?? []) map.set(d.date, { status: d.status, note: d.note })
    return map
  }, [daysQ.data])

  const bookedDates = useMemo(() => {
    const map = new Map<string, number>()
    for (const b of bookingsQ.data ?? []) {
      if (!b.eventDate || b.status === 'cancelled') continue
      map.set(b.eventDate, (map.get(b.eventDate) ?? 0) + 1)
    }
    return map
  }, [bookingsQ.data])

  const save = useMutation({
    mutationFn: async (status: AvailabilityStatus) => {
      if (!vendor) return { skipped: 0 }
      if (mode === 'range' && rangeStart && rangeEnd) {
        // Confirmed days are left alone unless the vendor explicitly overrides:
        // sweeping a month to "blocked" must not quietly cancel a real event.
        const protectedDays = protectedIn(rangeStart, rangeEnd, marks)
        if (protectedDays.length && !override) return { skipped: protectedDays.length, blocked: true }
        await setAvailabilityRange(vendor.id, rangeStart, rangeEnd, status, note || undefined)
        return { skipped: 0 }
      }
      if (!selected) return { skipped: 0 }
      await setAvailability(vendor.id, selected, status, note || undefined)
      return { skipped: 0 }
    },
    onSuccess: (r) => {
      if (r && 'blocked' in r && r.blocked) {
        setResult(
          `${r.skipped} date${r.skipped === 1 ? '' : 's'} in this range already hold a confirmed booking. Tap "Change confirmed dates too" to include them.`,
        )
        return
      }
      setResult('Calendar updated.')
      setNote('')
      setOverride(false)
      setSelected(null)
      setRangeStart(null)
      setRangeEnd(null)
      void queryClient.invalidateQueries({ queryKey: ['availability', vendor?.id] })
    },
    onError: (e: Error) => setResult(e.message),
  })

  if (initializing) {
    return (
      <div>
        <ScreenHeader title="Manage Booking Date" back />
        <div className="p-4"><Skeleton className="h-64 w-full" /></div>
      </div>
    )
  }
  if (!isVendor) return <Navigate to="/vendor/login" replace />

  const leading = new Date(cursor.y, cursor.m, 1).getDay()
  const cells: (string | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => iso(cursor.y, cursor.m, i + 1)),
  ]

  function pick(date: string) {
    setResult(null)
    setOverride(false)
    if (mode === 'single') {
      setSelected(date)
      setNote(marks.get(date)?.note ?? '')
      return
    }
    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(date)
      setRangeEnd(null)
    } else if (date < rangeStart) {
      setRangeEnd(rangeStart)
      setRangeStart(date)
    } else {
      setRangeEnd(date)
    }
  }

  const activeDate = mode === 'single' ? selected : null
  const activeStatus = activeDate ? marks.get(activeDate)?.status : undefined
  const needsOverride =
    (mode === 'single' && activeStatus === 'confirmed') ||
    (mode === 'range' && !!rangeStart && !!rangeEnd && protectedIn(rangeStart, rangeEnd, marks).length > 0)
  const canApply = mode === 'single' ? !!selected : !!rangeStart && !!rangeEnd

  return (
    <div className="pb-8">
      <ScreenHeader
        title="Manage Booking Date"
        subtitle={vendor?.name ?? undefined}
        back
      />

      {enabled === undefined && <div className="p-4"><Skeleton className="h-72 w-full" /></div>}

      {enabled === false && <BackendSetupNotice feature="Date availability" />}

      {enabled === true && (
        <div className="px-4 pt-4">
          {vendorQ.isLoading && <Skeleton className="h-72 w-full" />}
          {vendorQ.isError && <ErrorState onRetry={() => vendorQ.refetch()} />}
          {!vendorQ.isLoading && !vendor && (
            <p className="rounded-[var(--radius-card)] border border-line bg-surface p-4 text-sm text-muted">
              No vendor profile is linked to {email}, so there is no calendar to manage yet.
            </p>
          )}

          {vendor && (
            <>
              {/* Month navigation */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  aria-label="Previous month"
                  className="tap grid h-10 w-10 place-items-center rounded-[var(--radius-field)] border border-line bg-surface"
                  onClick={() =>
                    setCursor((c) => (c.m === 0 ? { y: c.y - 1, m: 11 } : { ...c, m: c.m - 1 }))
                  }
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden />
                </button>
                <h2 aria-live="polite" className="text-lg font-bold text-ink">
                  {monthLabel(cursor.y, cursor.m)}
                </h2>
                <button
                  type="button"
                  aria-label="Next month"
                  className="tap grid h-10 w-10 place-items-center rounded-[var(--radius-field)] border border-line bg-surface"
                  onClick={() =>
                    setCursor((c) => (c.m === 11 ? { y: c.y + 1, m: 0 } : { ...c, m: c.m + 1 }))
                  }
                >
                  <ChevronRight className="h-5 w-5" aria-hidden />
                </button>
              </div>

              {/* Single date / date range */}
              <div className="mt-3 grid grid-cols-2 gap-2">
                {(['single', 'range'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={mode === m}
                    onClick={() => {
                      setMode(m)
                      setSelected(null)
                      setRangeStart(null)
                      setRangeEnd(null)
                      setResult(null)
                    }}
                    className={cn(
                      'tap rounded-[var(--radius-field)] border px-3 py-2 text-sm font-semibold',
                      mode === m
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary-100)] text-[var(--color-primary)]'
                        : 'border-line bg-surface text-ink',
                    )}
                  >
                    {m === 'single' ? 'One date' : 'Date range'}
                  </button>
                ))}
              </div>

              {daysQ.isError && (
                <div className="mt-3">
                  <ErrorState onRetry={() => daysQ.refetch()} message={(daysQ.error as Error)?.message} />
                </div>
              )}

              {/* Grid */}
              <div className="mt-3 rounded-[var(--radius-card)] border border-line bg-surface p-2">
                <div className="grid grid-cols-7 gap-1 pb-1">
                  {WEEKDAYS.map((d, i) => (
                    <span key={i} className="py-1 text-center text-[11px] font-bold text-muted">
                      {d}
                    </span>
                  ))}
                </div>
                {daysQ.isLoading ? (
                  <Skeleton className="h-56 w-full" />
                ) : (
                  <div className="grid grid-cols-7 gap-1">
                    {cells.map((date, i) => {
                      if (!date) return <span key={`x${i}`} />
                      const mark = marks.get(date)
                      const status = mark?.status
                      const bookings = bookedDates.get(date) ?? 0
                      const isSelected =
                        date === selected ||
                        date === rangeStart ||
                        date === rangeEnd ||
                        (!!rangeStart && !!rangeEnd && date > rangeStart && date < rangeEnd)
                      return (
                        <button
                          key={date}
                          type="button"
                          onClick={() => pick(date)}
                          aria-pressed={isSelected}
                          aria-label={`${dayLabel(date)} — ${status ? AVAILABILITY_LABELS[status] : 'Not marked'}${bookings ? `, ${bookings} booking${bookings === 1 ? '' : 's'}` : ''}`}
                          className={cn(
                            'tap flex aspect-square flex-col items-center justify-center rounded-[var(--radius-field)] border text-sm',
                            status ? SWATCH[status] : 'bg-surface text-ink',
                            isSelected ? 'border-[var(--color-primary)] border-2' : 'border-line',
                          )}
                        >
                          <span className="tnum font-semibold">{Number(date.slice(8))}</span>
                          <span className="text-[9px] font-bold leading-none">
                            {status ? CODE[status] : bookings ? '•' : ' '}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Legend — code + label, so the calendar reads without colour */}
              <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                {AVAILABILITY_STATUSES.map((s) => (
                  <li key={s} className="flex items-center gap-1.5 text-xs text-ink-soft">
                    <span
                      className={cn(
                        'grid h-5 w-5 place-items-center rounded-[4px] text-[10px] font-bold',
                        SWATCH[s],
                      )}
                    >
                      {CODE[s]}
                    </span>
                    {AVAILABILITY_LABELS[s]}
                  </li>
                ))}
              </ul>

              {/* Editor */}
              <section className="mt-4 rounded-[var(--radius-card)] border border-line bg-surface p-4">
                <h3 className="font-bold text-ink">
                  {mode === 'single'
                    ? selected
                      ? dayLabel(selected)
                      : 'Pick a date'
                    : rangeStart && rangeEnd
                      ? `${dayLabel(rangeStart)} → ${dayLabel(rangeEnd)}`
                      : rangeStart
                        ? `From ${dayLabel(rangeStart)} — now pick the last date`
                        : 'Pick the first date of the range'}
                </h3>

                {mode === 'single' && selected && (
                  <p className="mt-1 text-sm text-muted">
                    Currently {activeStatus ? AVAILABILITY_LABELS[activeStatus] : 'not marked'}
                    {(bookedDates.get(selected) ?? 0) > 0 &&
                      ` · ${bookedDates.get(selected)} booking${bookedDates.get(selected) === 1 ? '' : 's'} on this date`}
                  </p>
                )}

                {needsOverride && (
                  <label className="mt-3 flex items-start gap-2 rounded-[var(--radius-field)] bg-surface-2 p-3 text-sm text-ink-soft">
                    <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent-ink,var(--color-primary))]" aria-hidden />
                    <span className="flex-1">
                      {mode === 'single'
                        ? 'This date holds a confirmed booking.'
                        : 'Some dates in this range hold confirmed bookings.'}{' '}
                      Changing it releases the date.
                    </span>
                    <input
                      type="checkbox"
                      checked={override}
                      onChange={(e) => setOverride(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0"
                      aria-label="Change confirmed dates too"
                    />
                  </label>
                )}

                <label className="mt-3 block">
                  <span className="text-sm font-semibold text-ink">Note (optional)</span>
                  <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Held for Sharma sangeet"
                    className="mt-1 w-full rounded-[var(--radius-field)] border border-line bg-surface-2 px-3 py-2.5 text-[15px] outline-none"
                  />
                </label>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  {AVAILABILITY_STATUSES.map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={s === 'confirmed' ? 'primary' : 'outline'}
                      disabled={!canApply || save.isPending || (needsOverride && !override)}
                      onClick={() => save.mutate(s)}
                    >
                      {AVAILABILITY_LABELS[s]}
                    </Button>
                  ))}
                </div>

                {result && (
                  <p role="status" className="mt-3 text-sm text-muted">
                    {result}
                  </p>
                )}
              </section>
            </>
          )}
        </div>
      )}
    </div>
  )
}

/** Dates inside an inclusive range that already carry a confirmed booking. */
function protectedIn(
  from: string,
  to: string,
  marks: Map<string, { status: AvailabilityStatus }>,
): string[] {
  const out: string[] = []
  for (const [date, m] of marks) {
    if (date >= from && date <= to && m.status === 'confirmed') out.push(date)
  }
  return out
}
