import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { VendorCard } from '../VendorCard'
import { VendorRow } from '../VendorRow'
import type { Vendor } from '@/types/domain'

/**
 * Venues are shortlisted on two numbers: how many guests sit down to eat, and
 * how many the place holds standing. No production row carries the floating
 * figure yet — the website's vendor form has to start collecting it — so these
 * guard the display against quietly regressing before the data arrives.
 */
function venue(amenities: Vendor['amenities']): Vendor {
  return {
    id: 'v1',
    name: 'Test Banquet',
    email: 'contact@test.example',
    category: ['banquet-halls'],
    location: 'Ranchi',
    price: null,
    priceUnit: null,
    vegPrice: '1050',
    nonVegPrice: '1300',
    description: null,
    images: [],
    image: null,
    rating: 4.5,
    status: 'active',
    badge: '',
    isTrending: false,
    amenities,
    paymentPolicies: {},
    createdAt: new Date().toISOString(),
  }
}

const wrap = (ui: React.ReactNode) => render(<MemoryRouter>{ui}</MemoryRouter>)

describe('venue capacity on listing surfaces', () => {
  it('shows both seating and floating capacity on the card', () => {
    wrap(<VendorCard vendor={venue({ seatingCapacity: '350', floatingCapacity: '1200' })} />)
    expect(screen.getByText(/350 seated/)).toBeTruthy()
    expect(screen.getByText(/1200 floating/)).toBeTruthy()
  })

  it('shows both on the dense row', () => {
    wrap(<VendorRow vendor={venue({ seatingCapacity: '250-300', floatingCapacity: '800' })} />)
    expect(screen.getByText(/250-300 seated/)).toBeTruthy()
    expect(screen.getByText(/800 floating/)).toBeTruthy()
  })

  it('shows floating capacity even when seating is missing', () => {
    wrap(<VendorCard vendor={venue({ floatingCapacity: '1500' })} />)
    expect(screen.getByText(/1500 floating/)).toBeTruthy()
    expect(screen.queryByText(/seated/)).toBeNull()
  })

  it('renders no capacity chips when the venue lists neither', () => {
    wrap(<VendorCard vendor={venue({})} />)
    expect(screen.queryByText(/seated|floating/)).toBeNull()
  })
})
