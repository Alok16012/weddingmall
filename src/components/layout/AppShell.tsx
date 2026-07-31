import { Outlet } from 'react-router-dom'
import { useSession } from '@/auth/SessionContext'
import { BottomNav } from './BottomNav'

/** Phone-width frame with the persistent bottom navigation. */
export function AppShell() {
  const { isVendor } = useSession()
  return (
    <div className="relative mx-auto min-h-[100svh] max-w-md bg-canvas">
      <main className="pb-20">
        <Outlet />
      </main>
      <BottomNav isVendor={isVendor} />
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
