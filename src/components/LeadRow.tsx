import { CalendarDays, Phone, User } from 'lucide-react'
import type { Lead } from '@/types/domain'
import { Badge } from './ui/Badge'
import { relativeTime } from '@/lib/format'

/** A single enquiry from the shared `leads` table (app + website). */
export function LeadRow({ lead }: { lead: Lead }) {
  const status = (lead.status ?? 'new').toLowerCase()
  return (
    <article className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="flex items-center gap-1.5 font-bold text-ink">
            <User className="h-4 w-4 text-muted" aria-hidden />
            {lead.customerName}
          </h3>
          <a
            href={`tel:+91${lead.customerPhone}`}
            className="tnum mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-primary)]"
          >
            <Phone className="h-3.5 w-3.5" aria-hidden /> +91 {lead.customerPhone}
          </a>
        </div>
        <Badge tone={status === 'new' ? 'coral' : 'neutral'}>{status}</Badge>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        {lead.weddingDate && (
          <span className="tnum inline-flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden />
            {new Date(lead.weddingDate).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        )}
        {lead.type && <span className="rounded bg-surface-2 px-1.5 py-0.5">{lead.type}</span>}
        <span className="ml-auto">{relativeTime(lead.createdAt)}</span>
      </div>
    </article>
  )
}
