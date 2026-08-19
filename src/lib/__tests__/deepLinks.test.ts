import { describe, expect, it } from 'vitest'
import { pathFromDeepLink } from '../deepLinks'

describe('deep link → route', () => {
  it('maps our https domain to the matching route', () => {
    expect(pathFromDeepLink('https://www.weddingmall.online/blogs/bridal-hairstyles')).toBe(
      '/blogs/bridal-hairstyles',
    )
    expect(pathFromDeepLink('https://weddingmall.online/')).toBe('/')
  })

  it('keeps the query string and hash', () => {
    expect(pathFromDeepLink('https://weddingmall.online/explore?city=Patna#top')).toBe(
      '/explore?city=Patna#top',
    )
  })

  it('drops a trailing slash so the route matches', () => {
    expect(pathFromDeepLink('https://weddingmall.online/venues/')).toBe('/venues')
  })

  it('maps the app scheme, where the first segment is the host', () => {
    expect(pathFromDeepLink('online.weddingmall.app://blogs/my-post')).toBe('/blogs/my-post')
    expect(pathFromDeepLink('online.weddingmall.app://bookings')).toBe('/bookings')
  })

  it('refuses links that are not ours', () => {
    expect(pathFromDeepLink('https://example.com/blogs/x')).toBeNull()
    expect(pathFromDeepLink('https://weddingmall.online.evil.test/x')).toBeNull()
    expect(pathFromDeepLink('javascript:alert(1)')).toBeNull()
    expect(pathFromDeepLink('not a url')).toBeNull()
  })
})
