import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { categoryLabel } from '@/types/domain'
import { countByCategory } from '@/services/vendors'

/**
 * Category nav tile. The backend has no categories table, so the imagery is a
 * curated map keyed by the real `vendors.category` slugs; the COUNT is live.
 */
const CATEGORY_IMG: Record<string, string> = {
  'wedding-venues': 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=200&q=70',
  'banquet-halls': 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=200&q=70',
  'marriage-garden-lawns': 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=200&q=70',
  'wedding-resorts': 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=200&q=70',
  'makeup-artists': 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=200&q=70',
  photographers: 'https://images.unsplash.com/photo-1554048612-b6a482bc67e5?auto=format&fit=crop&w=200&q=70',
  'mehendi-artists': 'https://images.unsplash.com/photo-1610173827043-9db50e0d8ef9?auto=format&fit=crop&w=200&q=70',
  'planning-decor': 'https://images.unsplash.com/photo-1509610973147-232dfea52a97?auto=format&fit=crop&w=200&q=70',
}

export function CategoryTile({ slug, city }: { slug: string; city?: string | null }) {
  const { data: count } = useQuery({
    queryKey: ['category-count', slug, city],
    queryFn: () => countByCategory(slug, city ?? undefined),
    staleTime: 5 * 60_000,
  })

  return (
    <Link
      to={`/explore?category=${slug}${city ? `&city=${encodeURIComponent(city)}` : ''}`}
      className="group flex flex-col items-center gap-1.5 text-center transition-transform active:scale-[0.96]"
    >
      <span className="relative block h-16 w-16 overflow-hidden rounded-full border border-line bg-surface-2">
        {CATEGORY_IMG[slug] && (
          <img src={CATEGORY_IMG[slug]} alt="" loading="lazy" className="h-full w-full object-cover" />
        )}
      </span>
      <span className="text-[11px] font-semibold leading-tight text-ink">{categoryLabel(slug)}</span>
      {count ? <span className="tnum text-[10px] text-muted">{count}</span> : null}
    </Link>
  )
}
