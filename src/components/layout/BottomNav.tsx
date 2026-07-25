import { NavLink } from 'react-router-dom'
import {
  Calendar,
  CalendarCheck,
  Compass,
  Heart,
  Home,
  LayoutDashboard,
  ListChecks,
  MessagesSquare,
  Store,
  User,
} from 'lucide-react'
import type { ComponentType } from 'react'
import type { Role } from '@/types/domain'
import { cn } from '@/lib/cn'

interface Tab {
  to: string
  label: string
  icon: ComponentType<{ className?: string }>
  badge?: number
  end?: boolean
}

const coupleTabs: Tab[] = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/explore', label: 'Explore', icon: Compass },
  { to: '/favourites', label: 'Shortlist', icon: Heart },
  { to: '/bookings', label: 'Bookings', icon: CalendarCheck },
  { to: '/profile', label: 'Profile', icon: User },
]

const vendorTabs: Tab[] = [
  { to: '/vendor', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/vendor/listings', label: 'Listings', icon: Store },
  { to: '/vendor/leads', label: 'Leads', icon: MessagesSquare },
  { to: '/vendor/calendar', label: 'Calendar', icon: Calendar },
  { to: '/vendor/account', label: 'Account', icon: User },
]

// Unused icons kept for future tab variants without re-import churn.
void ListChecks

export function BottomNav({ role, badges }: { role: Role; badges?: Record<string, number> }) {
  const tabs = role === 'vendor' ? vendorTabs : coupleTabs
  return (
    <nav
      aria-label={`${role} navigation`}
      className="glass fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-md items-stretch justify-around border-t border-line px-1 pb-[env(safe-area-inset-bottom)]"
    >
      {tabs.map((tab) => {
        const badge = badges?.[tab.to]
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              cn(
                'tap relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition',
                isActive ? 'text-coral' : 'text-muted',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className="relative">
                  <tab.icon className={cn('h-6 w-6', isActive && 'fill-coral/10')} />
                  {badge ? (
                    <span className="tnum absolute -right-2 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-coral px-1 text-[10px] font-bold text-white">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  ) : null}
                </span>
                {tab.label}
              </>
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}
