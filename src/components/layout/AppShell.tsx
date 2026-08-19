import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { OnboardingTour } from '@/components/OnboardingTour'

/**
 * Phone-width frame with the persistent bottom navigation.
 *
 * The tab set no longer varies by role — it is the same five destinations for
 * couples and vendors alike, with the vendor workspace reached from More.
 */
export function AppShell() {
  return (
    <div className="relative mx-auto min-h-[100svh] max-w-md bg-canvas">
      <main className="pb-20">
        <Outlet />
      </main>
      <BottomNav />
      {/* Only on tab surfaces — the tour points at the bottom navigation, which
          is exactly where a first-time user is when the app opens. */}
      <OnboardingTour />
    </div>
  )
}

/** Detail / form / auth surfaces — bottom navigation hidden. */
export function PlainShell() {
  return (
    <div className="relative mx-auto min-h-[100svh] max-w-md bg-canvas">
      <Outlet />
    </div>
  )
}
