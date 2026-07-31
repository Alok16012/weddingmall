import { Link } from 'react-router-dom'
import { useQueries } from '@tanstack/react-query'
import { Heart } from 'lucide-react'
import { getVendor } from '@/services/vendors'
import { useFavourites } from '@/hooks/useFavourites'
import { VendorCard } from '@/components/VendorCard'
import { EmptyState, VendorCardSkeleton } from '@/components/ui/states'
import { buttonClasses } from '@/components/ui/Button'
import { ScreenHeader } from '@/components/layout/ScreenHeader'

export default function Favourites() {
  const { ids } = useFavourites()

  // Shortlist is on-device; hydrate each id from the live vendors table.
  const results = useQueries({
    queries: ids.map((id) => ({
      queryKey: ['vendor', id],
      queryFn: () => getVendor(id),
      staleTime: 60_000,
    })),
  })

  const loading = results.some((r) => r.isLoading)
  const vendors = results.map((r) => r.data).filter((v): v is NonNullable<typeof v> => !!v)

  return (
    <div>
      <ScreenHeader title="Shortlist" subtitle={ids.length ? `${ids.length} saved` : undefined} />
      <div className="space-y-4 px-4 pt-1">
        {ids.length === 0 && (
          <EmptyState
            icon={<Heart className="h-7 w-7" />}
            title="No saved vendors yet"
            description="Tap the heart on any vendor to shortlist and compare them here."
            action={
              <Link to="/explore" className={buttonClasses({ size: 'sm' })}>
                Explore vendors
              </Link>
            }
          />
        )}
        {loading && ids.length > 0 && <VendorCardSkeleton />}
        {vendors.map((v, i) => (
          <VendorCard key={v.id} vendor={v} index={i} />
        ))}
      </div>
    </div>
  )
}
