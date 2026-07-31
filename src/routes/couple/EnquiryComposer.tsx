import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { CalendarDays, Check, Info, Phone, User } from 'lucide-react'
import { getVendor } from '@/services/vendors'
import { createLead, isValidIndianMobile } from '@/services/leads'
import { ServiceError } from '@/services/supabase/client'
import { Button, buttonClasses } from '@/components/ui/Button'
import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { Skeleton } from '@/components/ui/states'

const today = new Date().toISOString().slice(0, 10)

export default function EnquiryComposer() {
  const { vendorId = '' } = useParams()

  const { data: vendor, isLoading } = useQuery({
    queryKey: ['vendor', vendorId],
    queryFn: () => getVendor(vendorId),
  })

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [date, setDate] = useState('')
  const [errors, setErrors] = useState<{ name?: string; phone?: string; date?: string }>({})

  const mutation = useMutation({
    mutationFn: () =>
      createLead({
        vendorId,
        vendorName: vendor?.name,
        customerName: name,
        customerPhone: phone,
        weddingDate: date || undefined,
        type: 'app',
      }),
  })

  function validate(): boolean {
    const next: typeof errors = {}
    if (name.trim().length < 2) next.name = 'Please enter your name'
    if (!isValidIndianMobile(phone)) next.phone = 'Enter a valid 10-digit mobile number'
    if (date && date < today) next.date = 'Choose a future date'
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
            <Link to="/explore" className={buttonClasses({ fullWidth: true })}>
              Browse more vendors
            </Link>
            <Link
              to={`/vendor/${vendorId}`}
              className={buttonClasses({ variant: 'outline', fullWidth: true })}
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
        <Field label="Your name" icon={<User className="h-4 w-4" />} error={errors.name}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ananya Verma"
            autoComplete="name"
            className="w-full bg-transparent text-[15px] outline-none"
          />
        </Field>

        <Field label="Mobile number" icon={<Phone className="h-4 w-4" />} error={errors.phone}>
          <span className="text-[15px] text-muted">+91</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="numeric"
            maxLength={13}
            placeholder="10-digit mobile"
            autoComplete="tel"
            className="tnum w-full bg-transparent text-[15px] outline-none"
          />
        </Field>

        <Field label="Wedding date (optional)" icon={<CalendarDays className="h-4 w-4" />} error={errors.date}>
          <input
            type="date"
            min={today}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-transparent text-[15px] outline-none"
          />
        </Field>

        <p className="flex items-start gap-2 rounded-[var(--radius-card)] border border-line bg-surface-2 p-3 text-xs text-muted">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          Your name and number are shared with this vendor so they can respond. This enquiry reaches
          the same inbox as the WeddingMall website.
        </p>

        {mutation.isError && (
          <p className="rounded-[var(--radius-field)] bg-danger/10 p-3 text-sm text-danger">
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
  children,
}: {
  label: string
  icon: React.ReactNode
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-ink">{label}</label>
      <div className="flex items-center gap-2 rounded-[var(--radius-field)] border border-line bg-surface px-3 py-3 focus-within:border-[var(--color-primary)]">
        <span className="text-muted">{icon}</span>
        {children}
      </div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
}
