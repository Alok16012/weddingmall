import type { ReactNode } from 'react'
import { AlertCircle, Inbox, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from './Button'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-[var(--radius-field)]', className)} aria-hidden />
}

/** Card skeleton that matches VendorCard geometry (no layout shift). */
export function VendorCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] bg-surface shadow-[var(--shadow-card)]">
      <Skeleton className="h-44 w-full rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <div className="flex gap-3 pt-1">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 flex-1" />
        </div>
      </div>
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-surface-2 text-muted">
        {icon ?? <Inbox className="h-7 w-7" aria-hidden />}
      </div>
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      {description && <p className="mt-1 max-w-xs text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({ onRetry, message }: { onRetry?: () => void; message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-[var(--color-primary-100)] text-[var(--color-primary)]">
        <AlertCircle className="h-7 w-7" aria-hidden />
      </div>
      <h3 className="text-lg font-semibold text-ink">Something went wrong</h3>
      <p className="mt-1 max-w-xs text-sm text-muted">
        {message ?? 'We couldn’t load this right now. Please try again.'}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-5" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  )
}
