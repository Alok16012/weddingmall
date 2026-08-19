import { useQuery } from '@tanstack/react-query'
import { unreadNotificationCount } from '@/services/notifications'

/**
 * Unread badge count. Always resolves — the service answers 0 when the table
 * isn't there or nobody is signed in — so callers can render it unconditionally
 * and simply show nothing at zero.
 */
export function useUnreadNotifications(): number {
  const { data } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: unreadNotificationCount,
    // A badge that refreshes when the app comes back to the foreground is what
    // people expect; polling harder would cost battery for no real gain.
    staleTime: 60_000,
    retry: false,
  })
  return data ?? 0
}
