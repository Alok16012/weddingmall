import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider, useSession } from '@/auth/SessionContext'
import { queryClient } from '@/lib/queryClient'
import { router } from '@/routes/router'
import Splash from '@/routes/auth/Splash'
import { ConfigError } from '@/components/ConfigError'
import { getSupabase } from '@/services/supabase/client'

function Root() {
  const { initializing } = useSession()
  // Session-restore screen before the router mounts.
  if (initializing) return <Splash />
  return <RouterProvider router={router} />
}

export default function App() {
  // Fail loudly and usefully when the backend env is missing, rather than
  // letting every screen show a generic error.
  if (!getSupabase()) return <ConfigError />

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <Root />
      </SessionProvider>
    </QueryClientProvider>
  )
}
