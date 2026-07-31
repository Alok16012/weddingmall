import { useQuery } from '@tanstack/react-query'
import { Briefcase, MapPin } from 'lucide-react'
import { listJobs } from '@/services/content'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/states'
import { ScreenHeader } from '@/components/layout/ScreenHeader'

/** Open roles, published from the website admin (`jobs` table). */
export default function Careers() {
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['jobs'], queryFn: listJobs })

  return (
    <div className="pb-6">
      <ScreenHeader title="Careers" subtitle="Join the WeddingMall team" back />
      <div className="space-y-3 px-4 pt-1">
        {isLoading && [0, 1].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
        {isError && <ErrorState onRetry={() => refetch()} />}
        {!isLoading && !data?.length && (
          <EmptyState icon={<Briefcase className="h-7 w-7" />} title="No open roles right now" />
        )}
        {data?.map((j) => (
          <article key={j.id} className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
            <h3 className="font-bold text-ink">{j.title}</h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted">
              {j.type && (
                <span className="rounded-[var(--radius-pill)] bg-surface-2 px-2 py-0.5 font-medium">
                  {j.type}
                </span>
              )}
              {j.locations.map((l) => (
                <span key={l} className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" aria-hidden /> {l}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
