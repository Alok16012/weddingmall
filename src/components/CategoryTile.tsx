import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Store } from 'lucide-react'
import { categoryLabel } from '@/types/domain'
import { categorySummary } from '@/services/vendors'
import { Img } from './ui/Img'

/**
 * Category tile.
 *
 * The photo comes from a real vendor in that category. Stock imagery kept
 * mis-representing categories (a road shot for "Marriage Gardens"), and the
 * source photos had wildly different aspect ratios that cropped badly in a
 * circle. <Img> requests an exact square from the CDN, so every tile matches.
 *
 * The "N options" count the summary also returns is deliberately not rendered:
 * a raw listing count doesn't help anyone choose a category, and it reads as
 * thin next to a category holding only a dozen vendors. The query still runs —
 * it is what supplies the image — so nothing extra is fetched by keeping it.
 */
const SIZE = 64

export function CategoryTile({ slug, city }: { slug: string; city?: string | null }) {
  const { data } = useQuery({
    queryKey: ['category-summary', slug, city],
    queryFn: () => categorySummary(slug, city ?? undefined),
    staleTime: 5 * 60_000,
  })

  return (
    <Link
      to={`/explore?category=${slug}${city ? `&city=${encodeURIComponent(city)}` : ''}`}
      className="pressable flex flex-col items-center gap-1.5 text-center"
    >
      <Img
        src={data?.image}
        alt=""
        width={SIZE}
        height={SIZE}
        rounded="rounded-full"
        wrapperClassName="h-16 w-16 ring-1 ring-line"
        fallback={<Store className="h-5 w-5" aria-hidden />}
      />
      <span className="text-[11px] font-bold leading-tight text-ink">{categoryLabel(slug)}</span>
    </Link>
  )
}
