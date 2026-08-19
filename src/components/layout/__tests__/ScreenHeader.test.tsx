import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { BRAND_NAME } from '@/components/Brand'
import { ScreenHeader } from '../ScreenHeader'

describe('ScreenHeader', () => {
  it('shows the Wedding Mall logo and links it home', () => {
    render(
      <MemoryRouter>
        <ScreenHeader title="Wedding Services" />
      </MemoryRouter>,
    )

    const logoLink = screen.getByRole('link', { name: `${BRAND_NAME} home` })
    expect(screen.getByRole('img', { name: BRAND_NAME })).toBeVisible()
    expect(logoLink).toHaveTextContent(BRAND_NAME)
    expect(logoLink).toHaveAttribute('href', '/')
  })
})
