import { createBrowserRouter } from 'react-router-dom'
import { AppShell, PlainShell } from '@/components/layout/AppShell'
import Home from './couple/Home'
import Explore from './couple/Explore'
import Favourites from './couple/Favourites'
import Bookings from './couple/Bookings'
import Profile from './couple/Profile'
import ListingDetail from './couple/ListingDetail'
import EnquiryComposer from './couple/EnquiryComposer'
import Planner from './couple/Planner'
import Privacy from './couple/Privacy'
import Chat from './couple/Chat'
import VendorDashboard from './vendor/Dashboard'
import VendorListings from './vendor/Listings'
import VendorLeads from './vendor/Leads'
import VendorCalendar from './vendor/Calendar'
import VendorAccount from './vendor/Account'
import NotFound from './NotFound'

export const router = createBrowserRouter([
  {
    // Tab surfaces — bottom navigation visible.
    element: <AppShell />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/explore', element: <Explore /> },
      { path: '/favourites', element: <Favourites /> },
      { path: '/bookings', element: <Bookings /> },
      { path: '/profile', element: <Profile /> },
      { path: '/vendor', element: <VendorDashboard /> },
      { path: '/vendor/listings', element: <VendorListings /> },
      { path: '/vendor/leads', element: <VendorLeads /> },
      { path: '/vendor/calendar', element: <VendorCalendar /> },
      { path: '/vendor/account', element: <VendorAccount /> },
    ],
  },
  {
    // Detail / editor / chat surfaces — bottom navigation hidden.
    element: <PlainShell />,
    children: [
      { path: '/listing/:id', element: <ListingDetail /> },
      { path: '/enquiry/:listingId', element: <EnquiryComposer /> },
      { path: '/planner', element: <Planner /> },
      { path: '/privacy', element: <Privacy /> },
      { path: '/chat/:conversationId', element: <Chat /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])
