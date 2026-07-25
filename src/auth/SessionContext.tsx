import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Role } from '@/types/domain'

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
  /** Switch role shell without a second account (spec: Profile → Switch mode). */
  switchRole: (role: Role) => void
  signIn: (user: SessionUser) => void
  signOut: () => void
}

const SessionContext = createContext<SessionValue | null>(null)

const STORAGE_KEY = 'wm.session'

/**
 * Foundation session. A deterministic demo user is provided so both role shells
 * are navigable during Phases 1–3; real OTP auth (AUTH-01) replaces signIn in Phase 2.
 */
const DEMO_USER: SessionUser = {
  id: 'demo-user',
  displayName: 'Aarav',
  role: 'couple',
  city: 'Patna',
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as SessionUser) : DEMO_USER
    } catch {
      return DEMO_USER
    }
  })

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    else localStorage.removeItem(STORAGE_KEY)
  }, [user])

  const switchRole = useCallback((role: Role) => {
    setUser((u) => (u ? { ...u, role } : u))
  }, [])

  const signIn = useCallback((next: SessionUser) => setUser(next), [])
  const signOut = useCallback(() => setUser(null), [])

  const value = useMemo<SessionValue>(
    () => ({
      user,
      role: user?.role ?? 'couple',
      isAuthenticated: !!user,
      switchRole,
      signIn,
      signOut,
    }),
    [user, switchRole, signIn, signOut],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSession(): SessionValue {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within SessionProvider')
  return ctx
}
