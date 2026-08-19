import { NavLink } from 'react-router-dom'
import { Building2, Home, Menu, ShoppingBag, Store } from 'lucide-react'
import type { ComponentType } from 'react'
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications'
import { cn } from '@/lib/cn'

interface Tab {
  to: string
  label: string
  icon: ComponentType<{ className?: string }>
  end?: boolean
  /** Anchor name for the first-run spotlight tour. */
  tour?: string
}

/**
 * Primary navigation: Home · Venue · Vendors · Shopping · More.
 *
 * The same five destinations in the same order on Android, iOS and responsive
 * web — one information architecture, since all three run this build.
 *
 * Shortlist and the biodata maker used to sit here; both moved into More, which
 * is where the spec's Planning and Tools groups collect them. Vendors reach
 * their workspace from More → "Open vendor dashboard" for the same reason: five
 * tabs is the most that stays legible and thumb-sized in a 428px shell, and
 * browsing the catalogue is what nearly every session starts with.
 */
const TABS: Tab[] = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/venues', label: 'Venue', icon: Building2, tour: 'venue' },
  { to: '/vendors', label: 'Vendors', icon: Store, tour: 'vendors' },
  { to: '/shopping', label: 'Shopping', icon: ShoppingBag },
  { to: '/more', label: 'More', icon: Menu, tour: 'more' },
]

export function BottomNav() {
  // Unread alerts surface on More, which is where Inbox and My Bookings live.
  // Zero when the backend has no notifications table, so nothing appears.
  const unread = useUnreadNotifications()

  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-md items-stretch justify-around border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]"
    >
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          data-tour={tab.tour}
          className={({ isActive }) =>
            cn(
              // `min-w-0` lets "Shopping" shrink rather than push the row wide
              // at 320px; the label drops a step there instead of truncating.
              'tap relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 py-2 text-[10px] font-medium transition min-[360px]:text-[11px]',
              isActive ? 'text-[var(--color-primary)]' : 'text-muted',
            )
          }
        >
          {({ isActive }) => (
            <>
              {/* The active tab is marked by weight and a bar as well as
                  colour, so the state does not rely on colour alone. */}
              <span
                aria-hidden
                className={cn(
                  'absolute inset-x-3 top-0 h-0.5 rounded-full transition',
                  isActive ? 'bg-[var(--color-primary)]' : 'bg-transparent',
                )}
              />
              <span className="relative">
                <tab.icon className={cn('h-[22px] w-[22px] shrink-0', isActive && 'stroke-[2.4]')} />
                {tab.to === '/more' && unread > 0 && (
                  <span
                    className="tnum absolute -right-2 -top-1 min-w-[16px] rounded-[var(--radius-pill)] bg-[var(--color-primary)] px-1 text-[9px] font-bold leading-4 text-white"
                    aria-label={`${unread} unread notification${unread === 1 ? '' : 's'}`}
                  >
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </span>
              <span className="max-w-full truncate">{tab.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
