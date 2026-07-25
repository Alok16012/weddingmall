import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarClock, MessageCircle, Phone } from 'lucide-react'
import { repositories } from '@/repositories'
import type { EnquiryStage } from '@/types/domain'
import { formatINR, relativeTime } from '@/lib/format'
import { cn } from '@/lib/cn'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/states'
import { ScreenHeader } from '@/components/layout/ScreenHeader'

const STAGES: EnquiryStage[] = ['new', 'contacted', 'quoted', 'visit_scheduled', 'won', 'lost']
const stageTone: Record<EnquiryStage, 'coral' | 'saffron' | 'success' | 'muted'> = {
  new: 'coral',
  contacted: 'saffron',
  quoted: 'saffron',
  visit_scheduled: 'saffron',
  won: 'success',
  lost: 'muted',
}

export default function VendorLeads() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['vendor', 'leads'],
    queryFn: () => repositories.enquiries.listForVendor(),
  })

  const setStage = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: EnquiryStage }) =>
      repositories.enquiries.setStage(id, stage),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vendor', 'leads'] }),
  })

  return (
    <div>
      <ScreenHeader title="Leads" subtitle={`${data?.length ?? 0} active`} />
      <div className="space-y-3 px-4 pt-2">
        {isLoading && <Skeleton className="h-40 w-full" />}
        {data?.map((l) => (
          <div key={l.id} className="rounded-[var(--radius-card)] bg-surface p-4 shadow-[var(--shadow-card)]">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-ink">{l.coupleName}</h3>
                <p className="text-sm text-muted">
                  {l.guests ? `${l.guests} guests · ` : ''}{l.eventDate}
                  {l.budget ? ` · ${formatINR(l.budget.minorUnits, { compact: true })}` : ''}
                </p>
              </div>
              <Badge tone={stageTone[l.stage]}>{l.stage.replace('_', ' ')}</Badge>
            </div>
            <p className="mt-2 text-sm text-ink-soft">{l.message}</p>

            <div className="mt-3 flex gap-2">
              <a href="tel:+910000000000" className="tap inline-flex flex-1 items-center justify-center gap-1 rounded-[var(--radius-pill)] border border-line py-2 text-sm font-semibold text-ink">
                <Phone className="h-4 w-4" /> Call
              </a>
              <button className="tap inline-flex flex-1 items-center justify-center gap-1 rounded-[var(--radius-pill)] border border-line py-2 text-sm font-semibold text-ink">
                <MessageCircle className="h-4 w-4" /> Message
              </button>
              <button className="tap inline-flex flex-1 items-center justify-center gap-1 rounded-[var(--radius-pill)] border border-line py-2 text-sm font-semibold text-ink">
                <CalendarClock className="h-4 w-4" /> Visit
              </button>
            </div>

            {/* Stage transition */}
            <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto">
              {STAGES.map((s) => (
                <button
                  key={s}
                  onClick={() => setStage.mutate({ id: l.id, stage: s })}
                  disabled={setStage.isPending}
                  className={cn(
                    'shrink-0 rounded-[var(--radius-pill)] px-3 py-1 text-xs font-medium capitalize transition',
                    l.stage === s ? 'gradient-primary text-white' : 'bg-surface-2 text-muted',
                  )}
                >
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
            <p className="mt-2 text-right text-xs text-muted">{relativeTime(l.createdAt)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
