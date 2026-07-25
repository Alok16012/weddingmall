import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider, useSession } from '@/auth/SessionContext'
import { queryClient } from '@/lib/queryClient'
import { router } from '@/routes/router'
import Splash from '@/routes/auth/Splash'

function Root() {
  const { initializing } = useSession()
  // Session-restore screen (supabase mode) before the router mounts (spec C-01).
  if (initializing) return <Splash />
  return <RouterProvider router={router} />
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <Root />
      </SessionProvider>
    </QueryClientProvider>
  )
}
