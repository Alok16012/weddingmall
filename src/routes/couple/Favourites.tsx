import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Heart } from 'lucide-react'
import { repositories } from '@/repositories'
import { useFavourites } from '@/hooks/useFavourites'
import { VendorCard } from '@/components/VendorCard'
import { EmptyState, VendorCardSkeleton } from '@/components/ui/states'
import { buttonClasses } from '@/components/ui/Button'
import { ScreenHeader } from '@/components/layout/ScreenHeader'

export default function Favourites() {
  const { ids } = useFavourites()
  const { data: all, isLoading } = useQuery({
    queryKey: ['listings', { sort: 'recommended' }],
    queryFn: () => repositories.listings.list({ sort: 'recommended' }),
  })

  const shortlisted = (all ?? []).filter((l) => ids.includes(l.id))

  return (
    <div>
      <ScreenHeader title="Shortlist" subtitle={`${shortlisted.length} saved`} />
      <div className="space-y-4 px-4 pt-2">
        {isLoading && <VendorCardSkeleton />}
        {!isLoading && shortlisted.length === 0 && (
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
        {shortlisted.map((l) => (
          <VendorCard key={l.id} listing={l} />
        ))}
      </div>
    </div>
  )
}
