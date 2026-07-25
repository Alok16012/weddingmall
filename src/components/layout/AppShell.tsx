import { Outlet, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { repositories } from '@/repositories'
import { BottomNav } from './BottomNav'

/**
 * Mobile app frame. Centres a phone-width column (so the browser preview reads
 * as an app) and renders the role-aware bottom navigation with live badges.
 * The shell's role follows the route (a /vendor deep link shows vendor tabs),
 * so navigation stays correct even before the session role is switched.
 */
export function AppShell() {
  const { pathname } = useLocation()
  const role = pathname.startsWith('/vendor') ? 'vendor' : 'couple'

  const { data: convos } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => repositories.chat.conversations(),
  })
  const { data: leads } = useQuery({
    queryKey: ['vendor', 'leads'],
    queryFn: () => repositories.enquiries.listForVendor(),
    enabled: role === 'vendor',
  })

  const unread = (convos ?? []).reduce((n, c) => n + c.unread, 0)
  const newLeads = (leads ?? []).filter((l) => l.stage === 'new').length

  const badges: Record<string, number> =
    role === 'vendor' ? { '/vendor/leads': newLeads } : { '/bookings': unread }

  return (
    <div className="relative mx-auto min-h-[100svh] max-w-md bg-canvas">
      <main className="pb-24">
        <Outlet />
      </main>
      <BottomNav role={role} badges={badges} />
    </div>
  )
}

/** Layout for detail / editor / chat surfaces — bottom nav hidden. */
export function PlainShell() {
  return (
    <div className="relative mx-auto min-h-[100svh] max-w-md bg-canvas">
      <Outlet />
    </div>
  )
}
