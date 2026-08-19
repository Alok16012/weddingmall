import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQueries, useQuery } from '@tanstack/react-query'
import { CalendarDays, Check, PencilLine, Star } from 'lucide-react'
import { getVendor } from '@/services/vendors'
import { categoryLabel } from '@/types/domain'
import { submitReview } from '@/services/reviews'
import { useCapability } from '@/hooks/useCapability'
import { useFavourites } from '@/hooks/useFavourites'
import { useSession } from '@/auth/SessionContext'
import { ServiceError } from '@/services/supabase/client'
import { track } from '@/lib/analytics'
import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { Button, buttonClasses } from '@/components/ui/Button'
import { EmptyState, Skeleton } from '@/components/ui/states'
import { BackendSetupNotice } from '@/components/BackendSetupNotice'
import { Img } from '@/components/ui/Img'
import { cn } from '@/lib/cn'

const today = new Date().toISOString().slice(0, 10)

/**
 * Write a Review.
 *
 * `/review` asks which listing first — a review has to point at something, and
 * the shortlist is where the couple's own vendors already are. `/review/:id`
 * is the form. Submissions land as `pending` and a moderator publishes them,
 * so nothing written here appears on a listing unmoderated.
 */
export function ReviewPicker() {
  const enabled = useCapability('reviews')
  const { ids } = useFavourites()

  const results = useQueries({
    queries: ids.map((id) => ({
      queryKey: ['vendor', id],
      queryFn: () => getVendor(id),
      staleTime: 60_000,
    })),
  })
  const vendors = results.map((r) => r.data).filter((v): v is NonNullable<typeof v> => !!v)

  if (enabled === false) {
    return (
      <div>
        <ScreenHeader title="Write a Review" back />
        <BackendSetupNotice feature="Reviews">
          <Link to="/explore" className={buttonClasses({ size: 'sm' })}>
            Explore vendors
          </Link>
        </BackendSetupNotice>
      </div>
    )
  }

  return (
    <div className="pb-8">
      <ScreenHeader title="Write a Review" subtitle="Which vendor are you reviewing?" back />
      <div className="px-4 pt-4">
        {ids.length === 0 && (
          <EmptyState
            icon={<PencilLine className="h-7 w-7" />}
            title="Pick a vendor to review"
            description="Shortlist the venue or vendor you used, then come back here to write about them."
            action={
              <Link to="/explore" className={buttonClasses({ size: 'sm' })}>
                Find your vendor
              </Link>
            }
          />
        )}

        {results.some((r) => r.isLoading) && <Skeleton className="h-[72px] w-full" />}

        <ul className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface empty:hidden">
          {vendors.map((v) => (
            <li key={v.id}>
              <Link
                to={`/review/${v.id}`}
                className="tap flex items-center gap-3 px-3 py-3 hover:bg-surface-2"
              >
                <Img
                  src={v.image}
                  alt=""
                  width={48}
                  height={48}
                  wrapperClassName="h-12 w-12 shrink-0"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-ink">{v.name}</span>
                  {v.location && (
                    <span className="block truncate text-sm text-muted">{v.location}</span>
                  )}
                </span>
                <span className="shrink-0 text-sm font-semibold text-[var(--color-primary)]">
                  Review
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function ReviewComposer() {
  const { vendorId = '' } = useParams()
  const enabled = useCapability('reviews')
  const { userId } = useSession()

  const { data: vendor, isLoading } = useQuery({
    queryKey: ['vendor', vendorId],
    queryFn: () => getVendor(vendorId),
    enabled: !!vendorId,
  })

  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [serviceUsed, setServiceUsed] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [errors, setErrors] = useState<{ rating?: string; body?: string }>({})

  const mutation = useMutation({
    mutationFn: () =>
      submitReview({
        vendorId,
        vendorName: vendor?.name,
        rating,
        title: title.trim() || undefined,
        body: body.trim() || undefined,
        serviceUsed: serviceUsed.trim() || undefined,
        eventDate: eventDate || undefined,
      }),
    onSuccess: (review) => {
      track('review_submitted', {
        vendor_id: vendorId,
        rating: review.rating,
        verified_booking: review.verifiedBooking,
      })
    },
  })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const next: typeof errors = {}
    if (rating < 1) next.rating = 'Choose a rating'
    if (body.trim().length < 20) next.body = 'Please write at least a couple of sentences'
    setErrors(next)
    if (Object.keys(next).length === 0) mutation.mutate()
  }

  if (enabled === false) {
    return (
      <div>
        <ScreenHeader title="Write a Review" back />
        <BackendSetupNotice feature="Reviews" />
      </div>
    )
  }

  if (enabled === undefined || isLoading) {
    return (
      <div>
        <ScreenHeader title="Write a Review" back />
        <div className="space-y-3 p-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    )
  }

  if (!userId) {
    return (
      <div>
        <ScreenHeader title="Write a Review" back />
        <EmptyState
          icon={<PencilLine className="h-7 w-7" />}
          title="Verify your mobile to review"
          description="Reviews are tied to an account so couples can trust what they read here."
          action={
            <Link to="/welcome/verify" className={buttonClasses({ size: 'sm' })}>
              Verify mobile
            </Link>
          }
        />
      </div>
    )
  }

  if (mutation.isSuccess) {
    return (
      <div>
        <ScreenHeader title="Review Submitted" back />
        <div className="flex flex-col items-center px-6 py-12 text-center">
          <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-success-100 text-success">
            <Check className="h-8 w-8" aria-hidden />
          </div>
          <h2 className="text-2xl text-ink">Thank you</h2>
          <p className="mt-2 max-w-xs text-sm text-muted">
            Your review of {vendor?.name ?? 'this listing'} has been sent for moderation. It appears
            on the listing once it has been checked.
          </p>
          <div className="mt-6 flex w-full max-w-xs flex-col gap-2">
            <Link to={`/vendor/${vendorId}`} className={buttonClasses({ fullWidth: true })}>
              Back to listing
            </Link>
            <Link
              to="/explore"
              className={buttonClasses({ variant: 'outline', fullWidth: true })}
            >
              Explore vendors
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-8">
      <ScreenHeader title="Write a Review" subtitle={vendor?.name ?? undefined} back />
      <form onSubmit={submit} className="space-y-4 px-4 pt-3" noValidate>
        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold text-ink">Your rating</legend>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
                aria-pressed={rating === n}
                className="tap grid h-11 w-11 place-items-center rounded-full hover:bg-surface-2"
              >
                <Star
                  className={cn(
                    'h-7 w-7',
                    n <= rating
                      ? 'fill-[var(--color-accent)] text-[var(--color-accent)]'
                      : 'text-line',
                  )}
                  aria-hidden
                />
              </button>
            ))}
            {/* The count is stated in words too — the stars are not the only cue. */}
            <span className="tnum ml-1 text-sm text-muted">
              {rating ? `${rating} of 5` : 'Not rated'}
            </span>
          </div>
          {errors.rating && <p className="mt-1 text-xs text-danger">{errors.rating}</p>}
        </fieldset>

        <div>
          <label htmlFor="rv-title" className="mb-1.5 block text-sm font-semibold text-ink">
            Headline (optional)
          </label>
          <input
            id="rv-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={90}
            placeholder="e.g. Beautiful lawn, very helpful team"
            className="w-full rounded-[var(--radius-field)] border border-line bg-surface px-3.5 py-3 text-[15px] outline-none focus:border-[var(--color-primary)]"
          />
        </div>

        <div>
          <label htmlFor="rv-body" className="mb-1.5 block text-sm font-semibold text-ink">
            Your review
          </label>
          <textarea
            id="rv-body"
            rows={5}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What was the food, service and venue like? What should other couples know?"
            className="w-full resize-y rounded-[var(--radius-field)] border border-line bg-surface px-3.5 py-3 text-[15px] outline-none focus:border-[var(--color-primary)]"
          />
          {errors.body && <p className="mt-1 text-xs text-danger">{errors.body}</p>}
        </div>

        <div>
          <label htmlFor="rv-service" className="mb-1.5 block text-sm font-semibold text-ink">
            Service used (optional)
          </label>
          <input
            id="rv-service"
            value={serviceUsed}
            onChange={(e) => setServiceUsed(e.target.value)}
            list="rv-service-options"
            placeholder={
              vendor?.category?.[0] ? categoryLabel(vendor.category[0]) : 'e.g. Banquet hall'
            }
            className="w-full rounded-[var(--radius-field)] border border-line bg-surface px-3.5 py-3 text-[15px] outline-none focus:border-[var(--color-primary)]"
          />
          {/* The vendor's own categories are the honest options here — nothing
              invented, and free text still allowed for anything else. */}
          <datalist id="rv-service-options">
            {(vendor?.category ?? []).map((c) => (
              <option key={c} value={categoryLabel(c)} />
            ))}
          </datalist>
        </div>

        <div>
          <label htmlFor="rv-date" className="mb-1.5 block text-sm font-semibold text-ink">
            Event date (optional)
          </label>
          <div className="flex items-center gap-2 rounded-[var(--radius-field)] border border-line bg-surface px-3 py-3 focus-within:border-[var(--color-primary)]">
            <CalendarDays className="h-4 w-4 text-muted" aria-hidden />
            <input
              id="rv-date"
              type="date"
              max={today}
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full bg-transparent text-[15px] outline-none"
            />
          </div>
        </div>

        <p className="rounded-[var(--radius-card)] border border-line bg-surface-2 p-3 text-xs leading-relaxed text-muted">
          Reviews are checked before they are published. If your account has a completed booking
          with this vendor, the review is marked <strong>Verified Booking</strong> automatically.
        </p>

        {mutation.isError && (
          <p role="alert" className="rounded-[var(--radius-field)] bg-danger/10 p-3 text-sm text-danger">
            {mutation.error instanceof ServiceError
              ? mutation.error.message
              : 'Could not submit your review. Please try again.'}
          </p>
        )}

        <Button type="submit" fullWidth loading={mutation.isPending}>
          Submit review
        </Button>
      </form>
    </div>
  )
}
