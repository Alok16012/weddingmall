import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  CalendarDays, Check, Info, Mail, MapPin, MessageSquare, PartyPopper, Phone, User, Users,
} from 'lucide-react'
import { getVendor } from '@/services/vendors'
import { createLead, isValidEmail, isValidIndianMobile } from '@/services/leads'
import { createBookingFromEnquiry } from '@/services/bookings'
import { EVENT_TYPES } from '@/types/domain'
import { useCapability } from '@/hooks/useCapability'
import { useCity } from '@/hooks/useCity'
import { getEntry } from '@/auth/entry'
import { ServiceError } from '@/services/supabase/client'
import { track } from '@/lib/analytics'
import { Button, buttonClasses } from '@/components/ui/Button'
import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { Skeleton } from '@/components/ui/states'

const today = new Date().toISOString().slice(0, 10)

/**
 * Send Enquiry — the real destination behind every "Request Price" CTA.
 *
 * The enquiry is a row in the same `leads` table the website writes to, so a
 * vendor sees app and web enquiries in one list. Where the marketplace schema
 * is applied it also opens a booking record at `enquiry_sent`, which is what
 * makes the enquiry trackable in My Bookings and Inbox — never as a confirmed
 * booking, only as the first step of one.
 *
 * The extended fields (email, event type, guests, city, requirement) appear
 * only when the backend has columns to store them. Asking for something we
 * would then drop on the floor would be worse than not asking.
 */
export default function EnquiryComposer() {
  const { vendorId = '' } = useParams()
  const details = useCapability('leadDetails')
  const { city: currentCity } = useCity()

  const { data: vendor, isLoading } = useQuery({
    queryKey: ['vendor', vendorId],
    queryFn: () => getVendor(vendorId),
  })

  const [name, setName] = useState('')
  // Prefilled from the number verified at first launch — the one thing that
  // verification buys the guest, and the field they'd otherwise retype every time.
  const [phone, setPhone] = useState(() => getEntry()?.phone ?? '')
  const [email, setEmail] = useState('')
  const [date, setDate] = useState('')
  const [eventType, setEventType] = useState('')
  const [guests, setGuests] = useState('')
  const [city, setCity] = useState(currentCity ?? '')
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<{
    name?: string
    phone?: string
    email?: string
    date?: string
    guests?: string
  }>({})

  const mutation = useMutation({
    mutationFn: async () => {
      const guestCount = guests.trim() ? Number(guests.replace(/\D/g, '')) : undefined
      await createLead({
        vendorId,
        vendorName: vendor?.name,
        customerName: name,
        customerPhone: phone,
        weddingDate: date || undefined,
        type: 'app',
        customerEmail: email.trim() || undefined,
        eventType: eventType || undefined,
        guestCount,
        city: city.trim() || undefined,
        message: message.trim() || undefined,
      })
      // Booking record is best-effort: the enquiry itself has already been
      // stored, so a backend without the bookings table must not fail the send.
      try {
        const booking = await createBookingFromEnquiry({
          vendorId,
          vendorName: vendor?.name,
          eventDate: date || null,
          eventType: eventType || null,
          guestCount: guestCount ?? null,
          contactName: name,
          contactPhone: phone,
        })
        // Only fires when a row was genuinely written. It opens at
        // `enquiry_sent` — an enquiry, not a confirmed booking.
        if (booking) {
          track('booking_created', {
            vendor_id: vendorId,
            booking_id: booking.id,
            status: booking.status,
            has_date: !!date,
          })
        }
      } catch {
        /* Tracked below via the booking capability, not by failing the enquiry. */
      }
    },
    onSuccess: () => {
      track('send_enquiry', {
        vendor_id: vendorId,
        event_type: eventType || undefined,
        has_date: !!date,
        detailed: details === true,
      })
    },
  })

  function validate(): boolean {
    const next: typeof errors = {}
    if (name.trim().length < 2) next.name = 'Please enter your name'
    if (!isValidIndianMobile(phone)) next.phone = 'Enter a valid 10-digit mobile number'
    if (email.trim() && !isValidEmail(email)) next.email = 'Enter a valid email address'
    if (date && date < today) next.date = 'Choose a future date'
    const g = Number(guests.replace(/\D/g, ''))
    if (guests.trim() && (!g || g > 100000)) next.guests = 'Enter a realistic number of guests'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (validate()) mutation.mutate()
  }

  if (isLoading) {
    return (
      <div>
        <ScreenHeader title="Send Enquiry" back />
        <div className="space-y-3 p-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    )
  }

  /* Success */
  if (mutation.isSuccess) {
    return (
      <div>
        <ScreenHeader title="Enquiry Sent" back />
        <div className="flex flex-col items-center px-6 py-12 text-center">
          <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-success-100 text-success">
            <Check className="h-8 w-8" aria-hidden />
          </div>
          <h2 className="text-2xl text-ink">Enquiry sent!</h2>
          <p className="mt-2 max-w-xs text-sm text-muted">
            {vendor?.name ?? 'The vendor'} has received your details and will contact you on{' '}
            <span className="tnum font-semibold text-ink">{phone}</span> shortly.
          </p>
          <div className="mt-6 flex w-full max-w-xs flex-col gap-2">
            <Link to="/bookings" className={buttonClasses({ fullWidth: true })}>
              Track this enquiry
            </Link>
            <Link
              to="/explore"
              className={buttonClasses({ variant: 'outline', fullWidth: true })}
            >
              Browse more vendors
            </Link>
            <Link
              to={`/vendor/${vendorId}`}
              className={buttonClasses({ variant: 'ghost', fullWidth: true })}
            >
              Back to vendor
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-8">
      <ScreenHeader title="Send Enquiry" subtitle={vendor?.name ?? undefined} back />
      <form onSubmit={submit} className="space-y-4 px-4 pt-2" noValidate>
        <Field label="Your name" icon={<User className="h-4 w-4" />} error={errors.name} htmlFor="eq-name">
          <input
            id="eq-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ananya Verma"
            autoComplete="name"
            className="w-full bg-transparent text-[15px] outline-none"
          />
        </Field>

        <Field label="Mobile number" icon={<Phone className="h-4 w-4" />} error={errors.phone} htmlFor="eq-phone">
          <span className="text-[15px] text-muted">+91</span>
          <input
            id="eq-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="numeric"
            maxLength={13}
            placeholder="10-digit mobile"
            autoComplete="tel"
            className="tnum w-full bg-transparent text-[15px] outline-none"
          />
        </Field>

        {details === true && (
          <Field label="Email (optional)" icon={<Mail className="h-4 w-4" />} error={errors.email} htmlFor="eq-email">
            <input
              id="eq-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className="w-full bg-transparent text-[15px] outline-none"
            />
          </Field>
        )}

        <Field
          label="Event date (optional)"
          icon={<CalendarDays className="h-4 w-4" />}
          error={errors.date}
          htmlFor="eq-date"
        >
          <input
            id="eq-date"
            type="date"
            min={today}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-transparent text-[15px] outline-none"
          />
        </Field>

        {details === true && (
          <>
            <Field label="Event type (optional)" icon={<PartyPopper className="h-4 w-4" />} htmlFor="eq-type">
              <select
                id="eq-type"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full bg-transparent text-[15px] outline-none"
              >
                <option value="">Select</option>
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="Number of guests (optional)"
              icon={<Users className="h-4 w-4" />}
              error={errors.guests}
              htmlFor="eq-guests"
            >
              <input
                id="eq-guests"
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                inputMode="numeric"
                placeholder="e.g. 350"
                className="tnum w-full bg-transparent text-[15px] outline-none"
              />
            </Field>

            <Field label="City (optional)" icon={<MapPin className="h-4 w-4" />} htmlFor="eq-city">
              <input
                id="eq-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Patna"
                autoComplete="address-level2"
                className="w-full bg-transparent text-[15px] outline-none"
              />
            </Field>

            <div>
              <label htmlFor="eq-message" className="mb-1.5 block text-sm font-semibold text-ink">
                Your requirement (optional)
              </label>
              <div className="flex gap-2 rounded-[var(--radius-field)] border border-line bg-surface px-3 py-3 focus-within:border-[var(--color-primary)]">
                <MessageSquare className="mt-1 h-4 w-4 shrink-0 text-muted" aria-hidden />
                <textarea
                  id="eq-message"
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell the vendor what you're looking for — budget, menu, décor, dates you're considering."
                  className="w-full resize-y bg-transparent text-[15px] outline-none"
                />
              </div>
            </div>
          </>
        )}

        <p className="flex items-start gap-2 rounded-[var(--radius-card)] border border-line bg-surface-2 p-3 text-xs text-muted">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          Your name and number are shared with this vendor so they can respond. This enquiry reaches
          the same inbox as the Wedding Mall website.
        </p>

        {mutation.isError && (
          <p role="alert" className="rounded-[var(--radius-field)] bg-danger/10 p-3 text-sm text-danger">
            {mutation.error instanceof ServiceError
              ? mutation.error.message
              : 'Could not send your enquiry. Please try again.'}
          </p>
        )}

        <Button type="submit" fullWidth loading={mutation.isPending}>
          Send Enquiry
        </Button>
      </form>
    </div>
  )
}

function Field({
  label,
  icon,
  error,
  htmlFor,
  children,
}: {
  label: string
  icon: React.ReactNode
  error?: string
  htmlFor?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-ink">
        {label}
      </label>
      <div className="flex items-center gap-2 rounded-[var(--radius-field)] border border-line bg-surface px-3 py-3 focus-within:border-[var(--color-primary)]">
        <span className="text-muted">{icon}</span>
        {children}
      </div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
}
