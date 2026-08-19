import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, Share2, Sparkles, Tag } from 'lucide-react'
import { getBlogBySlug, listBlogs } from '@/services/content'
import { listVendors } from '@/services/vendors'
import { useCity } from '@/hooks/useCity'
import { BRAND_NAME, LEGAL_NAME, WEBSITE_URL } from '@/config/company'
import { breadcrumbSchema, setJsonLd, useSeo } from '@/lib/seo'
import { shareContent } from '@/lib/share'
import { track } from '@/lib/analytics'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/states'
import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { VendorCard } from '@/components/VendorCard'
import { buttonClasses } from '@/components/ui/Button'

/**
 * Wedding Ideas & Inspiration.
 *
 * Articles are real `blogs` rows — nothing is padded out with sample posts, so
 * the list is exactly as long as the editorial actually is. Each article
 * publishes `Article` and `BreadcrumbList` schema plus a canonical and Open
 * Graph tags, and ends on a route back into the marketplace, which is what the
 * `blog_cta_clicked` event measures.
 */
const SUBTITLE =
  'Expert advice, real weddings, planning guides and inspiration for every celebration.'

export function BlogList() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['blogs'],
    queryFn: () => listBlogs(),
  })

  useSeo({
    title: 'Wedding Ideas & Inspiration',
    description: SUBTITLE,
    canonical: '/blogs',
  })

  useEffect(() => {
    setJsonLd('blog-breadcrumb', breadcrumbSchema([
      ['Home', '/'],
      ['Wedding Ideas & Inspiration', '/blogs'],
    ]))
    return () => setJsonLd('blog-breadcrumb', null)
  }, [])

  return (
    <div className="pb-6">
      <ScreenHeader title="Wedding Ideas & Inspiration" back />
      <div className="px-4 pb-1">
        <p className="text-sm leading-relaxed text-muted">{SUBTITLE}</p>
      </div>
      <div className="space-y-4 px-4 pt-3">
        {isLoading && [0, 1].map((i) => <Skeleton key={i} className="h-40 w-full" />)}
        {isError && <ErrorState onRetry={() => refetch()} />}
        {!isLoading && !data?.length && (
          <EmptyState
            icon={<Sparkles className="h-7 w-7" />}
            title="No articles yet"
            description="New planning guides and real weddings are published here."
          />
        )}
        {data?.map((b) => (
          <Link
            key={b.id}
            to={`/blogs/${b.slug}`}
            className="card-interactive block overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface"
          >
            {b.image && <img src={b.image} alt="" className="h-40 w-full object-cover" />}
            <div className="p-4">
              {b.category && (
                <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-[var(--color-accent)]">
                  <Tag className="h-3 w-3" aria-hidden /> {b.category}
                </span>
              )}
              <h3 className="mt-1 text-base font-bold text-ink">{b.title}</h3>
              {b.excerpt && <p className="mt-1 line-clamp-2 text-sm text-muted">{b.excerpt}</p>}
              <p className="mt-2 text-xs text-muted">
                {b.author ? `By ${b.author} · ` : ''}
                {formatDate(b.createdAt)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export function BlogDetail() {
  const { slug = '' } = useParams()
  const { city } = useCity()
  const [shareNote, setShareNote] = useState<string | null>(null)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['blog', slug],
    queryFn: () => getBlogBySlug(slug),
  })

  // Related listings: the marketplace route out of the article. Real rows from
  // `vendors`, scoped to the reader's city when one is set.
  const related = useQuery({
    queryKey: ['blog-related', city],
    queryFn: () =>
      listVendors({ city: city ?? undefined, pageSize: 4, sort: 'recommended' }).then((p) => p.items),
    enabled: !!data,
  })

  const canonical = `/blogs/${slug}`

  useSeo(
    data
      ? {
          title: data.title,
          description: data.excerpt ?? SUBTITLE,
          canonical,
          image: data.image ?? undefined,
          type: 'article',
          publishedAt: data.createdAt,
          author: data.author ?? undefined,
        }
      : null,
  )

  useEffect(() => {
    if (!data) return
    track('blog_view', { slug: data.slug, title: data.title, category: data.category ?? undefined })
  }, [data])

  useEffect(() => {
    if (!data) return
    const url = `${WEBSITE_URL}${canonical}`
    setJsonLd('article', {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: data.title,
      description: data.excerpt ?? undefined,
      image: data.image ? [data.image] : undefined,
      datePublished: data.createdAt,
      articleSection: data.category ?? undefined,
      author: { '@type': data.author ? 'Person' : 'Organization', name: data.author ?? BRAND_NAME },
      publisher: {
        '@type': 'Organization',
        name: BRAND_NAME,
        legalName: LEGAL_NAME,
        url: WEBSITE_URL,
      },
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    })
    setJsonLd(
      'article-breadcrumb',
      breadcrumbSchema([
        ['Home', '/'],
        ['Wedding Ideas & Inspiration', '/blogs'],
        [data.title, canonical],
      ]),
    )
    return () => {
      setJsonLd('article', null)
      setJsonLd('article-breadcrumb', null)
    }
  }, [data, canonical])

  if (isLoading) {
    return (
      <div>
        <ScreenHeader title="" back />
        <div className="space-y-3 p-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    )
  }
  if (isError || !data) {
    return (
      <div>
        <ScreenHeader title="Article" back />
        <ErrorState onRetry={() => refetch()} message="This article could not be found." />
      </div>
    )
  }

  async function share() {
    if (!data) return
    const outcome = await shareContent({
      title: data.title,
      text: data.excerpt ?? `${data.title} — ${BRAND_NAME}`,
      url: `${WEBSITE_URL}${canonical}`,
    })
    track('blog_cta_clicked', { slug: data.slug, cta: 'share', outcome })
    setShareNote(
      outcome === 'copied'
        ? 'Link copied to your clipboard'
        : outcome === 'unavailable'
          ? 'Sharing isn’t available here'
          : null,
    )
  }

  return (
    <div className="pb-10">
      <ScreenHeader title="" back />
      {data.image && <img src={data.image} alt="" className="h-52 w-full object-cover" />}
      <div className="px-4 pt-4">
        {/* Breadcrumb, visible as well as structured. */}
        <nav aria-label="Breadcrumb" className="text-xs text-muted">
          <Link to="/blogs" className="font-semibold text-[var(--color-primary)]">
            Wedding Ideas &amp; Inspiration
          </Link>
        </nav>

        {data.category && (
          <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-[var(--color-accent)]">
            <Tag className="h-3 w-3" aria-hidden /> {data.category}
          </span>
        )}
        <h1 className="mt-1 text-[1.75rem] leading-tight text-ink">{data.title}</h1>
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
          {data.author && <span>By {data.author}</span>}
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" aria-hidden />
            {formatDate(data.createdAt)}
          </span>
        </p>

        <button
          type="button"
          onClick={() => void share()}
          className={buttonClasses({ variant: 'outline', size: 'sm', className: 'mt-3' })}
        >
          <Share2 className="h-4 w-4" aria-hidden /> Share article
        </button>
        {shareNote && (
          <p role="status" className="mt-2 text-xs text-muted">
            {shareNote}
          </p>
        )}

        {data.excerpt && (
          <p className="mt-4 border-l-2 border-[var(--color-primary)] pl-3 text-[15px] leading-relaxed text-ink-soft">
            {data.excerpt}
          </p>
        )}
        {data.content && (
          <div className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-ink-soft">
            {data.content}
          </div>
        )}
      </div>

      {/* The route back into the marketplace. */}
      <section className="mt-8 px-4">
        <div className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
          <h2 className="text-lg font-bold text-ink">Ready to start planning?</h2>
          <p className="mt-1 text-sm text-muted">
            Browse venues and vendors {city ? `in ${city}` : 'across India'}, shortlist your
            favourites and send an enquiry — no charges to enquire.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              to="/venues"
              onClick={() => track('blog_cta_clicked', { slug: data.slug, cta: 'venues' })}
              className={buttonClasses({ size: 'sm' })}
            >
              Explore venues
            </Link>
            <Link
              to="/vendors"
              onClick={() => track('blog_cta_clicked', { slug: data.slug, cta: 'vendors' })}
              className={buttonClasses({ variant: 'outline', size: 'sm' })}
            >
              Find vendors
            </Link>
          </div>
        </div>
      </section>

      {!!related.data?.length && (
        <section className="mt-6">
          <h2 className="px-4 text-lg font-bold text-ink">
            {city ? `Popular in ${city}` : 'Recommended listings'}
          </h2>
          <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pt-3">
            {related.data.map((v) => (
              // The card's own link is the control; this wrapper only listens to
              // the bubble, so nothing here needs to be focusable itself.
              <div
                key={v.id}
                className="w-[270px] shrink-0"
                onClick={() => track('blog_cta_clicked', { slug: data.slug, cta: 'related_listing', vendor_id: v.id })}
              >
                <VendorCard vendor={v} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(+d)
    ? ''
    : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}
