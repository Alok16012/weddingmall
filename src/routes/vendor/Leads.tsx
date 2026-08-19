import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MessageSquare } from 'lucide-react'
import { useSession } from '@/auth/SessionContext'
import { getMyVendor } from '@/services/vendors'
import { listLeadsForVendor } from '@/services/leads'
import { cn } from '@/lib/cn'
import { LeadRow } from '@/components/LeadRow'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/states'
import { ScreenHeader } from '@/components/layout/ScreenHeader'

export default function VendorLeads() {
  const { email, isVendor, initializing } = useSession()
  const [filter, setFilter] = useState<'all' | 'new'>('all')

  const vendorQ = useQuery({
    queryKey: ['my-vendor', email],
    queryFn: () => getMyVendor(email!),
    enabled: !!email,
  })
  const leadsQ = useQuery({
    queryKey: ['my-leads', vendorQ.data?.id],
    queryFn: () => listLeadsForVendor(vendorQ.data!.id),
    enabled: !!vendorQ.data?.id,
    // Enquiries arrive from the website too — keep this fresh on focus.
    refetchOnWindowFocus: true,
    staleTime: 15_000,
  })

  const leads = useMemo(() => {
    const rows = leadsQ.data ?? []
    return filter === 'new'
      ? rows.filter((l) => (l.status ?? 'new').toLowerCase() === 'new')
      : rows
  }, [leadsQ.data, filter])

  if (initializing) return <div className="p-4"><Skeleton className="h-24 w-full" /></div>
  if (!isVendor) return <Navigate to="/vendor/login" replace />

  return (
    <div>
      <ScreenHeader
        title="Enquiries"
        subtitle={leadsQ.data ? `${leadsQ.data.length} total` : undefined}
      />
      <div className="px-4">
        <div className="flex rounded-[var(--radius-field)] bg-surface-2 p-1">
          {(['all', 'new'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'tap flex-1 rounded-[var(--radius-field)] py-2 text-sm font-semibold capitalize transition',
                filter === f ? 'bg-surface text-ink shadow-[var(--shadow-card)]' : 'text-muted',
              )}
            >
              {f === 'all' ? 'All' : 'New'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 px-4 pt-4">
        {leadsQ.isLoading && [0, 1].map((i) => <Skeleton key={i} className="h-28 w-full" />)}
        {leadsQ.isError && <ErrorState onRetry={() => leadsQ.refetch()} />}
        {!leadsQ.isLoading && leads.length === 0 && (
          <EmptyState
            icon={<MessageSquare className="h-7 w-7" />}
            title={filter === 'new' ? 'No new enquiries' : 'No enquiries yet'}
            description="Enquiries from the app and the Wedding Mall website both appear here."
          />
        )}
        {leads.map((l) => (
          <LeadRow key={l.id} lead={l} />
        ))}
      </div>
    </div>
  )
}
