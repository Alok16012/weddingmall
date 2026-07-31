import { createBrowserRouter } from 'react-router-dom'
import { AppShell, PlainShell } from '@/components/layout/AppShell'
import Home from './couple/Home'
import Explore from './couple/Explore'
import Favourites from './couple/Favourites'
import Profile from './couple/Profile'
import VendorDetail from './couple/VendorDetail'
import EnquiryComposer from './couple/EnquiryComposer'
import CitySelector from './couple/CitySelector'
import Privacy from './couple/Privacy'
import { BlogList, BlogDetail } from './couple/Blogs'
import Careers from './couple/Careers'
import Terms from './couple/Terms'
import VendorLogin from './auth/VendorLogin'
import ResetPassword from './auth/ResetPassword'
import VendorDashboard from './vendor/Dashboard'
import VendorLeads from './vendor/Leads'
import NotFound from './NotFound'

export const router = createBrowserRouter([
  {
    // Tab surfaces — bottom navigation visible.
    element: <AppShell />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/explore', element: <Explore /> },
      { path: '/favourites', element: <Favourites /> },
      { path: '/more', element: <Profile /> },
      { path: '/vendor', element: <VendorDashboard /> },
      { path: '/vendor/leads', element: <VendorLeads /> },
    ],
  },
  {
    // Detail / form / auth surfaces — bottom navigation hidden.
    element: <PlainShell />,
    children: [
      { path: '/vendor/login', element: <VendorLogin /> },
      { path: '/auth/reset', element: <ResetPassword /> },
      { path: '/vendor/:id', element: <VendorDetail /> },
      { path: '/enquiry/:vendorId', element: <EnquiryComposer /> },
      { path: '/city', element: <CitySelector /> },
      { path: '/blogs', element: <BlogList /> },
      { path: '/blogs/:slug', element: <BlogDetail /> },
      { path: '/careers', element: <Careers /> },
      { path: '/privacy', element: <Privacy /> },
      { path: '/legal/terms', element: <Terms /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])
