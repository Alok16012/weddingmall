import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, CalendarCheck, ClipboardList, MessageSquare } from 'lucide-react'
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
  type NotificationKind,
} from '@/services/notifications'
import { useCapability } from '@/hooks/useCapability'
import { useSession } from '@/auth/SessionContext'
import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { BackendSetupNotice } from '@/components/BackendSetupNotice'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/states'
import { Button, buttonClasses } from '@/components/ui/Button'
import { cn } from '@/lib/cn'

/**
 * Notifications, for whichever identity is signed in — a couple sees their
 * booking and reply alerts, a vendor sees enquiries and messages. The rows come
 * from database triggers, so nothing here is synthesised in the client.
 */
const ICON: Record<NotificationKind, typeof Bell> = {
  enquiry_received: ClipboardList,
  vendor_replied: MessageSquare,
  message_received: MessageSquare,
  booking_status_changed: ClipboardList,
  booking_confirmed: CalendarCheck,
}

export default function Notifications() {
  const enabled = useCapability('notifications')
  const { userId } = useSession()
  const queryClient = useQueryClient()

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => listNotifications(),
    enabled: enabled === true,
    retry: false,
  })

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['notifications'] })
    void queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] })
  }

  const readAll = useMutation({ mutationFn: markAllNotificationsRead, onSuccess: invalidate })
  const readOne = useMutation({ mutationFn: markNotificationRead, onSuccess: invalidate })

  const unread = (data ?? []).filter((n) => !n.readAt).length

  return (
    <div className="pb-6">
      <ScreenHeader
        title="Notifications"
        back
        right={
          unread > 0 ? (
            <Button size="sm" variant="ghost" onClick={() => readAll.mutate()}>
              Mark all read
            </Button>
          ) : undefined
        }
      />

      {enabled === undefined && (
        <div className="space-y-3 px-4 pt-4">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      )}

      {enabled === false && <BackendSetupNotice feature="Notifications" />}

      {enabled === true && (
        <div className="space-y-2.5 px-4 pt-4">
          {isLoading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
          {isError && <ErrorState onRetry={() => refetch()} message={(error as Error)?.message} />}

          {!isLoading && !isError && !userId && (
            <EmptyState
              icon={<Bell className="h-7 w-7" />}
              title="Verify your mobile to get updates"
              description="Alerts about your enquiries and bookings are tied to your account."
              action={
                <Link to="/welcome/verify" className={buttonClasses({ size: 'sm' })}>
                  Verify mobile
                </Link>
              }
            />
          )}

          {!isLoading && !isError && userId && data?.length === 0 && (
            <EmptyState
              icon={<Bell className="h-7 w-7" />}
              title="Nothing new"
              description="Replies from vendors and changes to your bookings appear here."
            />
          )}

          {data?.map((n) => (
            <NotificationRow key={n.id} n={n} onRead={() => readOne.mutate(n.id)} />
          ))}
        </div>
      )}
    </div>
  )
}

function NotificationRow({ n, onRead }: { n: AppNotification; onRead: () => void }) {
  const Icon = ICON[n.kind] ?? Bell
  const unread = !n.readAt

  const body = (
    <>
      <span
        className={cn(
          'grid h-9 w-9 shrink-0 place-items-center rounded-full',
          unread ? 'bg-[var(--color-primary-100)] text-[var(--color-primary)]' : 'bg-surface-2 text-muted',
        )}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className={cn('truncate', unread ? 'font-bold text-ink' : 'font-semibold text-ink-soft')}>
            {n.title}
          </span>
          {/* "New" in words as well as weight — never colour alone. */}
          {unread && (
            <span className="shrink-0 rounded-[var(--radius-pill)] bg-[var(--color-primary)] px-1.5 py-0.5 text-[10px] font-bold text-white">
              New
            </span>
          )}
        </span>
        {n.body && <span className="mt-0.5 block line-clamp-2 text-sm text-muted">{n.body}</span>}
        <span className="tnum mt-1 block text-xs text-muted">{when(n.createdAt)}</span>
      </span>
    </>
  )

  const className = 'flex w-full items-start gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-3 text-left'

  return n.link ? (
    <Link to={n.link} onClick={onRead} className={cn(className, 'card-interactive')}>
      {body}
    </Link>
  ) : (
    <button type="button" onClick={onRead} className={cn(className, 'tap')}>
      {body}
    </button>
  )
}

function when(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(+d)) return ''
  const mins = Math.round((Date.now() - d.getTime()) / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  if (mins < 60 * 24) return `${Math.round(mins / 60)} h ago`
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}
