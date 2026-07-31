import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { getSupabase } from '@/services/supabase/client'
import * as authService from '@/services/auth'

/**
 * Session model for this backend.
 *
 * There is no `profiles` table and no customer accounts — the website captures
 * enquiries anonymously. So the app is GUEST-FIRST: everyone can browse and
 * enquire, and only vendors sign in (email + password) to see their leads.
 */
interface SessionValue {
  /** Supabase auth user email, when a vendor is signed in. */
  email: string | null
  isVendor: boolean
  /** True until the initial session has been restored. */
  initializing: boolean
  signIn: (email: string, password: string) => Promise<void>
  sendPasswordReset: (email: string) => Promise<void>
  signOut: () => Promise<void>
}

const SessionContext = createContext<SessionValue | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    const client = getSupabase()
    if (!client) {
      setInitializing(false)
      return
    }
    let active = true
    client.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setInitializing(false)
    })
    const { data: sub } = client.auth.onAuthStateChange((_event, next) => {
      setSession(next)
    })
    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    await authService.signInWithEmail(email, password)
  }, [])

  const sendPasswordReset = useCallback(async (email: string) => {
    await authService.sendPasswordReset(email)
  }, [])

  const signOut = useCallback(async () => {
    await authService.signOut()
    setSession(null)
  }, [])

  const value = useMemo<SessionValue>(
    () => ({
      email: session?.user?.email ?? null,
      isVendor: !!session?.user,
      initializing,
      signIn,
      sendPasswordReset,
      signOut,
    }),
    [session, initializing, signIn, sendPasswordReset, signOut],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSession(): SessionValue {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within SessionProvider')
  return ctx
}
