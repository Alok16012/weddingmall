import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { Role } from '@/types/domain'
import { env } from '@/lib/env'
import { getSupabase } from '@/lib/supabase'

interface SessionUser {
  id: string
  displayName: string
  role: Role
  city: string
}

interface SessionValue {
  user: SessionUser | null
  role: Role
  isAuthenticated: boolean
  /** True until the initial session (supabase mode) has been restored. */
  initializing: boolean
  /** supabase mode: send an OTP to an Indian mobile (E.164). */
  requestOtp: (phoneE164: string) => Promise<void>
  /** supabase mode: verify the 6-digit SMS code; resolves the profile. */
  verifyOtp: (phoneE164: string, token: string) => Promise<void>
  switchRole: (role: Role) => void
  signOut: () => Promise<void>
}

const SessionContext = createContext<SessionValue | null>(null)
const STORAGE_KEY = 'wm.session'
const SUPABASE_MODE = env.dataSource === 'supabase'

const DEMO_USER: SessionUser = { id: 'demo-user', displayName: 'Aarav', role: 'couple', city: 'Patna' }

function userFromSession(session: Session | null): SessionUser | null {
  if (!session?.user) return null
  const meta = session.user.user_metadata ?? {}
  return {
    id: session.user.id,
    displayName: (meta.display_name as string) || 'You',
    role: (meta.role as Role) || 'couple',
    city: (meta.city as string) || 'Patna',
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() => {
    if (SUPABASE_MODE) return null // guest until a session is restored
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as SessionUser) : DEMO_USER
    } catch {
      return DEMO_USER
    }
  })
  const [initializing, setInitializing] = useState(SUPABASE_MODE)

  // Demo mode: persist the local session.
  useEffect(() => {
    if (SUPABASE_MODE) return
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    else localStorage.removeItem(STORAGE_KEY)
  }, [user])

  // Supabase mode: restore session + subscribe to auth changes.
  useEffect(() => {
    if (!SUPABASE_MODE) return
    const client = getSupabase()
    if (!client) {
      setInitializing(false)
      return
    }
    let active = true
    client.auth.getSession().then(({ data }) => {
      if (!active) return
      setUser(userFromSession(data.session))
      setInitializing(false)
    })
    const { data: sub } = client.auth.onAuthStateChange((_event, session) => {
      setUser(userFromSession(session))
    })
    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const requestOtp = useCallback(async (phoneE164: string) => {
    const client = getSupabase()
    if (!client) throw new Error('Backend unavailable.')
    const { error } = await client.auth.signInWithOtp({ phone: phoneE164 })
    if (error) throw error
  }, [])

  const verifyOtp = useCallback(async (phoneE164: string, token: string) => {
    const client = getSupabase()
    if (!client) throw new Error('Backend unavailable.')
    const { data, error } = await client.auth.verifyOtp({ phone: phoneE164, token, type: 'sms' })
    if (error) throw error
    // Bootstrap a profile row on first sign-in (idempotent).
    if (data.user) {
      await client.from('profiles').upsert({ id: data.user.id, role: 'couple' }, { onConflict: 'id' })
    }
  }, [])

  const switchRole = useCallback(
    (role: Role) => {
      setUser((u) => (u ? { ...u, role } : u))
      if (SUPABASE_MODE) {
        const client = getSupabase()
        void client?.auth.updateUser({ data: { role } })
        void client?.from('profiles').update({ role }).eq('id', user?.id ?? '')
      }
    },
    [user?.id],
  )

  const signOut = useCallback(async () => {
    if (SUPABASE_MODE) await getSupabase()?.auth.signOut()
    setUser(null)
  }, [])

  const value = useMemo<SessionValue>(
    () => ({
      user,
      role: user?.role ?? 'couple',
      isAuthenticated: !!user,
      initializing,
      requestOtp,
      verifyOtp,
      switchRole,
      signOut,
    }),
    [user, initializing, requestOtp, verifyOtp, switchRole, signOut],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSession(): SessionValue {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within SessionProvider')
  return ctx
}

// eslint-disable-next-line react-refresh/only-export-components
export const isSupabaseAuth = SUPABASE_MODE
