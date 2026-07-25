import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from '@/auth/SessionContext'
import { queryClient } from '@/lib/queryClient'
import { router } from '@/routes/router'

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <RouterProvider router={router} />
      </SessionProvider>
    </QueryClientProvider>
  )
}
