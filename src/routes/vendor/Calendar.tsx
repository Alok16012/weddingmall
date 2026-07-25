import { useState } from 'react'
import { cn } from '@/lib/cn'
import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { Badge } from '@/components/ui/Badge'

/** Availability calendar — block/reopen dates (spec CAL-01). Fixture-backed for now. */
export default function VendorCalendar() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const first = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startWeekday = first.getDay()

  const [blocked, setBlocked] = useState<Set<number>>(new Set([5, 12, 20]))
  const booked = new Set([5])

  function toggle(day: number) {
    setBlocked((prev) => {
      const next = new Set(prev)
      if (next.has(day)) next.delete(day)
      else next.add(day)
      return next
    })
  }

  return (
    <div>
      <ScreenHeader title="Availability" subtitle={first.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} />
      <div className="px-4">
        <div className="flex gap-3 pb-3 text-xs text-muted">
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-success" /> Open</span>
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-line" /> Blocked</span>
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-coral" /> Booked</span>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} className="py-1 font-semibold">{d}</div>
          ))}
          {Array.from({ length: startWeekday }).map((_, i) => (
            <div key={`e${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const isBooked = booked.has(day)
            const isBlocked = blocked.has(day)
            return (
              <button
                key={day}
                onClick={() => !isBooked && toggle(day)}
                disabled={isBooked}
                className={cn(
                  'tnum tap grid aspect-square place-items-center rounded-[var(--radius-field)] text-sm font-medium',
                  isBooked
                    ? 'gradient-primary text-white'
                    : isBlocked
                      ? 'bg-line text-muted line-through'
                      : 'bg-success-100 text-success',
                )}
              >
                {day}
              </button>
            )
          })}
        </div>

        <div className="mt-5 rounded-[var(--radius-card)] bg-surface p-4 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-ink">Dec 5 — booked</h3>
            <Badge tone="coral">Confirmed</Badge>
          </div>
          <p className="mt-1 text-sm text-muted">Ananya Verma · 600 guests · Lawn</p>
        </div>
      </div>
    </div>
  )
}
