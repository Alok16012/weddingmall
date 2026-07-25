import { Star } from 'lucide-react'
import { cn } from '@/lib/cn'

export function Stars({
  rating,
  count,
  className,
}: {
  rating: number
  count?: number
  className?: string
}) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-sm', className)}>
      <Star className="h-4 w-4 fill-saffron text-saffron" aria-hidden />
      <span className="tnum font-semibold text-ink">{rating.toFixed(1)}</span>
      {count !== undefined && <span className="text-muted">({count})</span>}
      <span className="sr-only">{`${rating.toFixed(1)} out of 5 stars${count ? `, ${count} reviews` : ''}`}</span>
    </span>
  )
}
