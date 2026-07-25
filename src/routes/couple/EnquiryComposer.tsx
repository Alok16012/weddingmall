import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, Check, Info, Users, Wallet } from 'lucide-react'
import { repositories } from '@/repositories'
import { Button } from '@/components/ui/Button'
import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { Skeleton } from '@/components/ui/states'

const MAX_MESSAGE = 1000
const today = new Date().toISOString().slice(0, 10)

interface Errors {
  date?: string
  guests?: string
  message?: string
}

export default function EnquiryComposer() {
  const { listingId = '' } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: listing, isLoading } = useQuery({
    queryKey: ['listing', listingId],
    queryFn: () => repositories.listings.getById(listingId),
  })

  const [date, setDate] = useState('')
  const [guests, setGuests] = useState('')
  const [budget, setBudget] = useState('')
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<Errors>({})

  const mutation = useMutation({
    mutationFn: () =>
      repositories.enquiries.create({
        listingId,
        message: message.trim(),
        eventDate: date || undefined,
        guests: guests ? Number(guests) : undefined,
        budgetMinor: budget ? Number(budget) * 100 : undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['enquiries', 'couple'] })
      navigate('/chat/cnv1', { replace: true })
    },
  })

  function validate(): boolean {
    const next: Errors = {}
    if (date && date < today) next.date = 'Choose a future date'
    if (guests) {
      const g = Number(guests)
      if (!Number.isFinite(g) || g < 1 || g > 10000) next.guests = 'Guests must be 1–10,000'
    }
    if (message.trim().length === 0) next.message = 'Add a short message'
    if (message.length > MAX_MESSAGE) next.message = `Max ${MAX_MESSAGE} characters`
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
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="pb-8">
      <ScreenHeader title="Send Enquiry" subtitle={listing?.title} back />
      <form onSubmit={submit} className="space-y-4 px-4 pt-2" noValidate>
        <Field label="Event date" icon={<CalendarDays className="h-4 w-4" />} error={errors.date}>
          <input
            type="date"
            min={today}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-transparent text-[15px] outline-none"
          />
        </Field>

        <Field label="Guests" icon={<Users className="h-4 w-4" />} error={errors.guests}>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={10000}
            placeholder="e.g. 500"
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
            className="w-full bg-transparent text-[15px] outline-none"
          />
        </Field>

        <Field label="Budget (₹, optional)" icon={<Wallet className="h-4 w-4" />}>
          <input
            type="number"
            inputMode="numeric"
            placeholder="e.g. 500000"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className="w-full bg-transparent text-[15px] outline-none"
          />
        </Field>

        <div>
          <label className="mb-1 block text-sm font-semibold text-ink">Message</label>
          <textarea
            rows={4}
            maxLength={MAX_MESSAGE}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell the vendor about your wedding, dates and requirements…"
            className="w-full rounded-[var(--radius-card)] border border-line bg-surface p-3 text-[15px] outline-none focus:border-coral"
            aria-invalid={!!errors.message}
          />
          <div className="mt-1 flex justify-between text-xs">
            <span className="text-danger">{errors.message ?? ''}</span>
            <span className="tnum text-muted">{message.length}/{MAX_MESSAGE}</span>
          </div>
        </div>

        <p className="flex items-start gap-2 rounded-[var(--radius-card)] bg-surface-2 p-3 text-xs text-muted">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          Your contact details are shared with this vendor only after you send this enquiry, so they can respond to you.
        </p>

        {mutation.isError && (
          <p className="text-sm text-danger">Couldn’t send. Please check your connection and retry.</p>
        )}

        <Button type="submit" fullWidth loading={mutation.isPending} leftIcon={<Check className="h-5 w-5" />}>
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
  children,
}: {
  label: string
  icon: React.ReactNode
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-semibold text-ink">{label}</label>
      <div className="flex items-center gap-2 rounded-[var(--radius-card)] border border-line bg-surface px-3 py-3 focus-within:border-coral">
        <span className="text-muted">{icon}</span>
        {children}
      </div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
}
