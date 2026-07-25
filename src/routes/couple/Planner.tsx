import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Check } from 'lucide-react'
import { repositories } from '@/repositories'
import { cn } from '@/lib/cn'
import { Skeleton } from '@/components/ui/states'
import { ScreenHeader } from '@/components/layout/ScreenHeader'

export default function Planner() {
  const qc = useQueryClient()
  const { data: milestones, isLoading } = useQuery({
    queryKey: ['planner'],
    queryFn: () => repositories.planner.milestones(),
  })

  const toggle = useMutation({
    mutationFn: (id: string) => repositories.planner.toggle(id),
    onSuccess: (next) => qc.setQueryData(['planner'], next),
  })

  const done = (milestones ?? []).filter((m) => m.done).length
  const total = milestones?.length ?? 0
  const pct = total ? Math.round((done / total) * 100) : 0

  return (
    <div>
      <ScreenHeader title="Wedding Planner" subtitle={`${done} of ${total} milestones done`} back />
      <div className="px-4">
        <div className="mb-4 h-2 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full gradient-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
        {isLoading && <Skeleton className="h-40 w-full" />}
        <ul className="space-y-2">
          {milestones?.map((m) => (
            <li key={m.id}>
              <button
                onClick={() => toggle.mutate(m.id)}
                className="tap flex w-full items-center gap-3 rounded-[var(--radius-card)] bg-surface p-4 text-left shadow-[var(--shadow-card)]"
                aria-pressed={m.done}
              >
                <span
                  className={cn(
                    'grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition',
                    m.done ? 'gradient-primary border-transparent text-white' : 'border-line text-transparent',
                  )}
                >
                  <Check className="h-4 w-4" aria-hidden />
                </span>
                <span className={cn('font-medium', m.done ? 'text-muted line-through' : 'text-ink')}>
                  {m.title}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
