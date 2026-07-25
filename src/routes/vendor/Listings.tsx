import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Eye, Pause, Play } from 'lucide-react'
import { repositories } from '@/repositories'
import type { ListingStatus } from '@/types/domain'
import { formatINR } from '@/lib/format'
import { cn } from '@/lib/cn'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/states'
import { ScreenHeader } from '@/components/layout/ScreenHeader'

const statusTone: Record<ListingStatus, 'success' | 'saffron' | 'muted'> = {
  published: 'success',
  paused: 'saffron',
  draft: 'muted',
}

export default function VendorListings() {
  const { data, isLoading } = useQuery({
    queryKey: ['vendor', 'listings'],
    queryFn: () => repositories.vendor.listings(),
  })
  const [overrides, setOverrides] = useState<Record<string, ListingStatus>>({})

  return (
    <div>
      <ScreenHeader title="Listings" subtitle={`${data?.length ?? 0} total`} />
      <div className="space-y-3 px-4 pt-2">
        {isLoading && <Skeleton className="h-28 w-full" />}
        {data?.map((l) => {
          const status = overrides[l.id] ?? l.status
          const paused = status === 'paused'
          return (
            <div key={l.id} className="flex gap-3 rounded-[var(--radius-card)] bg-surface p-3 shadow-[var(--shadow-card)]">
              <img src={l.coverImage.url} alt={l.coverImage.alt} className="h-20 w-20 shrink-0 rounded-[var(--radius-field)] object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate font-semibold text-ink">{l.title}</h3>
                  <Badge tone={statusTone[status]}>{status}</Badge>
                </div>
                <p className="mt-0.5 text-sm text-muted">
                  {l.fromPrice ? formatINR(l.fromPrice.minorUnits, { compact: true }) : 'On request'}
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => setOverrides((o) => ({ ...o, [l.id]: paused ? 'published' : 'paused' }))}
                    className={cn(
                      'tap inline-flex items-center gap-1 rounded-[var(--radius-pill)] px-3 py-1.5 text-xs font-semibold',
                      paused ? 'gradient-primary text-white' : 'border border-line text-ink',
                    )}
                  >
                    {paused ? <><Play className="h-3.5 w-3.5" /> Publish</> : <><Pause className="h-3.5 w-3.5" /> Pause</>}
                  </button>
                  <span className="inline-flex items-center gap-1 rounded-[var(--radius-pill)] border border-line px-3 py-1.5 text-xs font-medium text-muted">
                    <Eye className="h-3.5 w-3.5" /> {l.reviewCount * 7} views
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
