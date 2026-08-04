import { NavLink } from 'react-router-dom'
import { Compass, FileText, Heart, Home, Menu, Store } from 'lucide-react'
import type { ComponentType } from 'react'
import { cn } from '@/lib/cn'
import { useFavourites } from '@/hooks/useFavourites'

interface Tab {
  to: string
  label: string
  icon: ComponentType<{ className?: string }>
  end?: boolean
  badge?: number
}

/** Customer tabs. Vendors reach their workspace from More → dashboard. */
export function BottomNav({ isVendor }: { isVendor?: boolean }) {
  const { count } = useFavourites()

  const tabs: Tab[] = [
    { to: '/', label: 'Home', icon: Home, end: true },
    { to: '/explore', label: 'Explore', icon: Compass },
    { to: '/favourites', label: 'Shortlist', icon: Heart, badge: count },
    // Five tabs is the most that fits legibly in the 428px shell, so vendors
    // get their workspace here and reach the biodata maker from More instead.
    ...(isVendor
      ? [{ to: '/vendor', label: 'Business', icon: Store } as Tab]
      : [{ to: '/biodata', label: 'Biodata', icon: FileText } as Tab]),
    { to: '/more', label: 'More', icon: Menu },
  ]

  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-md items-stretch justify-around border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]"
    >
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            cn(
              'tap relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition',
              isActive ? 'text-[var(--color-primary)]' : 'text-muted',
            )
          }
        >
          {({ isActive }) => (
            <>
              <span className="relative">
                <tab.icon className={cn('h-[22px] w-[22px]', isActive && 'stroke-[2.4]')} />
                {tab.badge ? (
                  <span className="tnum absolute -right-2 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[var(--color-primary)] px-1 text-[10px] font-bold text-white">
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                ) : null}
              </span>
              {tab.label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
