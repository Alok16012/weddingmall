import { useEffect } from 'react'
import { BRAND_NAME, WEBSITE_URL } from '@/config/company'

/**
 * Head management for a client-rendered app.
 *
 * There is no SSR here, so these tags are written into the live document. That
 * is enough for the things that read the DOM after JavaScript runs — Google's
 * renderer, the in-app browsers, the share sheet's title — and it keeps the
 * canonical/OG data next to the screen that owns it instead of in a build step.
 * Crawlers that never execute JavaScript still get the defaults in `index.html`.
 *
 * Everything set here is reverted on unmount, so navigating away from an
 * article does not leave its title on the next screen.
 */
export interface SeoInput {
  title: string
  description?: string
  /** Path or absolute URL. Relative paths resolve against the public site. */
  canonical?: string
  image?: string
  type?: 'website' | 'article'
  /** ISO date, articles only. */
  publishedAt?: string
  author?: string
}

function absolute(url: string | undefined): string | undefined {
  if (!url) return undefined
  return /^https?:\/\//i.test(url) ? url : new URL(url, WEBSITE_URL).toString()
}

function setMeta(selector: string, attr: 'name' | 'property', key: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', value)
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.rel = rel
    document.head.appendChild(el)
  }
  el.href = href
}

/** Replace a named JSON-LD block. Passing `null` removes it. */
export function setJsonLd(id: string, data: unknown | null) {
  const existing = document.head.querySelector(`script[data-seo="${id}"]`)
  if (!data) {
    existing?.remove()
    return
  }
  const el = existing ?? document.createElement('script')
  el.setAttribute('type', 'application/ld+json')
  el.setAttribute('data-seo', id)
  el.textContent = JSON.stringify(data)
  if (!existing) document.head.appendChild(el)
}

/**
 * Apply page metadata for as long as the component is mounted.
 *
 * `seo` may be null while data is still loading; nothing is written until
 * there is something real to write.
 */
export function useSeo(seo: SeoInput | null) {
  const key = seo ? JSON.stringify(seo) : ''
  useEffect(() => {
    if (!key) return
    const input = JSON.parse(key) as SeoInput

    const previous = {
      title: document.title,
      description: document.head.querySelector<HTMLMetaElement>('meta[name="description"]')?.content,
      canonical: document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href,
      ogTitle: document.head.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.content,
      ogDescription: document.head.querySelector<HTMLMetaElement>('meta[property="og:description"]')
        ?.content,
      ogUrl: document.head.querySelector<HTMLMetaElement>('meta[property="og:url"]')?.content,
      ogImage: document.head.querySelector<HTMLMetaElement>('meta[property="og:image"]')?.content,
      ogType: document.head.querySelector<HTMLMetaElement>('meta[property="og:type"]')?.content,
    }

    const url = absolute(input.canonical) ?? window.location.href
    const title = `${input.title} — ${BRAND_NAME}`

    document.title = title
    if (input.description) {
      setMeta('meta[name="description"]', 'name', 'description', input.description)
      setMeta('meta[property="og:description"]', 'property', 'og:description', input.description)
      setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', input.description)
    }
    setLink('canonical', url)
    setMeta('meta[property="og:title"]', 'property', 'og:title', title)
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title)
    setMeta('meta[property="og:url"]', 'property', 'og:url', url)
    setMeta('meta[property="og:type"]', 'property', 'og:type', input.type ?? 'website')
    const image = absolute(input.image)
    if (image) setMeta('meta[property="og:image"]', 'property', 'og:image', image)

    return () => {
      document.title = previous.title
      if (previous.description)
        setMeta('meta[name="description"]', 'name', 'description', previous.description)
      if (previous.canonical) setLink('canonical', previous.canonical)
      if (previous.ogTitle) setMeta('meta[property="og:title"]', 'property', 'og:title', previous.ogTitle)
      if (previous.ogDescription)
        setMeta('meta[property="og:description"]', 'property', 'og:description', previous.ogDescription)
      if (previous.ogUrl) setMeta('meta[property="og:url"]', 'property', 'og:url', previous.ogUrl)
      if (previous.ogImage)
        setMeta('meta[property="og:image"]', 'property', 'og:image', previous.ogImage)
      if (previous.ogType) setMeta('meta[property="og:type"]', 'property', 'og:type', previous.ogType)
    }
  }, [key])
}

/** `BreadcrumbList` for a trail of `[label, path]` pairs. */
export function breadcrumbSchema(trail: [string, string][]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map(([name, path], i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name,
      item: absolute(path),
    })),
  }
}
