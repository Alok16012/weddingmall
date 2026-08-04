import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useEntry } from './entry'
import { useSession } from './SessionContext'
import { isNativeApp } from '@/lib/platform'
import Splash from '@/routes/auth/Splash'

/**
 * Sends a first-time app user to the Guest / Vendor choice before anything else.
 *
 * Only inside the installed app. On the web the site stays exactly as it is —
 * publicly crawlable, deep-linkable, no interstitial in front of a vendor page
 * someone reached from search. The requirement was about what happens *after
 * installing the app*, and that is precisely where it applies.
 *
 * The route that was asked for is carried through in `state.from`, so an app
 * deep link (a shared vendor page, a notification) still lands where it meant
 * to once the choice is made.
 */
export function EntryGate() {
  const { isVendor, initializing } = useSession()
  const { entry } = useEntry()
  const location = useLocation()

  if (!isNativeApp()) return <Outlet />
  // A vendor whose session survived the app restart has plainly already chosen.
  if (initializing) return <Splash />
  if (!entry && !isVendor)
    return (
      <Navigate to="/welcome" replace state={{ from: location.pathname + location.search }} />
    )
  return <Outlet />
}
