import { createBrowserRouter } from 'react-router-dom'
import { AppShell, PlainShell } from '@/components/layout/AppShell'
import { RequireAuth } from '@/auth/RequireAuth'
import Onboarding from './auth/Onboarding'
import PhoneAuth from './auth/PhoneAuth'
import Home from './couple/Home'
import Explore from './couple/Explore'
import Favourites from './couple/Favourites'
import Bookings from './couple/Bookings'
import Profile from './couple/Profile'
import ListingDetail from './couple/ListingDetail'
import Products from './couple/Products'
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

const authed = (el: React.ReactNode) => <RequireAuth>{el}</RequireAuth>

export const router = createBrowserRouter([
  // Auth surfaces (full-screen, no shell).
  { path: '/onboarding', element: <Onboarding /> },
  { path: '/auth', element: <PhoneAuth /> },
  {
    // Tab surfaces — bottom navigation visible. Guests may browse Home/Explore.
    element: <AppShell />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/explore', element: <Explore /> },
      { path: '/favourites', element: <Favourites /> },
      { path: '/bookings', element: authed(<Bookings />) },
      { path: '/profile', element: authed(<Profile />) },
      { path: '/vendor', element: authed(<VendorDashboard />) },
      { path: '/vendor/listings', element: authed(<VendorListings />) },
      { path: '/vendor/leads', element: authed(<VendorLeads />) },
      { path: '/vendor/calendar', element: authed(<VendorCalendar />) },
      { path: '/vendor/account', element: authed(<VendorAccount />) },
    ],
  },
  {
    // Detail / editor / chat surfaces — bottom navigation hidden.
    element: <PlainShell />,
    children: [
      { path: '/listing/:id', element: <ListingDetail /> },
      { path: '/products', element: <Products /> },
      { path: '/enquiry/:listingId', element: authed(<EnquiryComposer />) },
      { path: '/planner', element: authed(<Planner />) },
      { path: '/privacy', element: authed(<Privacy />) },
      { path: '/chat/:conversationId', element: authed(<Chat />) },
      { path: '*', element: <NotFound /> },
    ],
  },
])
