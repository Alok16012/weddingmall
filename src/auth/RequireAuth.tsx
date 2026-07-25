import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useSession, isSupabaseAuth } from './SessionContext'

/**
 * Gate for protected actions (enquiry, booking, chat, vendor workspace).
 * Guests browsing in supabase mode are sent through onboarding → OTP, then
 * returned to where they were headed. In demo mode everything is open.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, initializing } = useSession()
  const location = useLocation()

  if (!isSupabaseAuth || isAuthenticated) return <>{children}</>
  if (initializing) return null // splash is shown by the app shell during restore

  return <Navigate to="/onboarding" replace state={{ from: location.pathname + location.search }} />
}
