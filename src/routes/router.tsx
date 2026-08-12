import { createBrowserRouter } from 'react-router-dom'
import { AppShell, PlainShell } from '@/components/layout/AppShell'
import { EntryGate } from '@/auth/EntryGate'
import Home from './couple/Home'
import Explore from './couple/Explore'
import Favourites from './couple/Favourites'
import Profile from './couple/Profile'
import Biodata from './couple/Biodata'
import VendorDetail from './couple/VendorDetail'
import EnquiryComposer from './couple/EnquiryComposer'
import CitySelector from './couple/CitySelector'
import Services from './couple/Services'
import Privacy from './couple/Privacy'
import { BlogList, BlogDetail } from './couple/Blogs'
import Careers from './couple/Careers'
import Terms from './couple/Terms'
import Welcome from './auth/Welcome'
import GuestVerify from './auth/GuestVerify'
import VendorLogin from './auth/VendorLogin'
import ResetPassword from './auth/ResetPassword'
import VendorDashboard from './vendor/Dashboard'
import VendorLeads from './vendor/Leads'
import NotFound from './NotFound'

// Every route below is written from the site root. That is exactly right for
// the app (Capacitor serves the bundle from `/`) and for the production domain,
// where Vite's BASE_URL is `/` and this resolves to no basename at all. It only
// matters when the same build is hosted under a sub-path — a GitHub Pages
// project site, say — where without it React Router would try to match the
// sub-path as part of the route and every URL would fall through to NotFound.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

export const router = createBrowserRouter([
  {
    // Entry surfaces — always reachable, never behind the gate (the gate sends
    // people here, and the vendor sign-in has to work before a choice exists).
    element: <PlainShell />,
    children: [
      { path: '/welcome', element: <Welcome /> },
      { path: '/welcome/verify', element: <GuestVerify /> },
      { path: '/vendor/login', element: <VendorLogin /> },
      { path: '/auth/reset', element: <ResetPassword /> },
    ],
  },
  {
    // Everything else. In the installed app the Guest / Vendor choice comes
    // first; on the web the gate is transparent.
    element: <EntryGate />,
    children: [
      {
        // Tab surfaces — bottom navigation visible.
        element: <AppShell />,
        children: [
          { path: '/', element: <Home /> },
          { path: '/explore', element: <Explore /> },
          { path: '/favourites', element: <Favourites /> },
          { path: '/biodata', element: <Biodata /> },
          { path: '/more', element: <Profile /> },
          { path: '/vendor', element: <VendorDashboard /> },
          { path: '/vendor/leads', element: <VendorLeads /> },
        ],
      },
      {
        // Detail / form surfaces — bottom navigation hidden.
        element: <PlainShell />,
        children: [
          { path: '/vendor/:id', element: <VendorDetail /> },
          { path: '/enquiry/:vendorId', element: <EnquiryComposer /> },
          { path: '/city', element: <CitySelector /> },
          { path: '/services', element: <Services /> },
          { path: '/blogs', element: <BlogList /> },
          { path: '/blogs/:slug', element: <BlogDetail /> },
          { path: '/careers', element: <Careers /> },
          { path: '/privacy', element: <Privacy /> },
          { path: '/legal/terms', element: <Terms /> },
          { path: '*', element: <NotFound /> },
        ],
      },
    ],
  },
], { basename })
