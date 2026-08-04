import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Info, MessageSquare, Phone, ShieldCheck } from 'lucide-react'
import { useEntry } from '@/auth/entry'
import { OTP_LENGTH, sendMobileOtp, verifyMobileOtp } from '@/services/auth'
import { isValidIndianMobile, normaliseMobile } from '@/services/leads'
import { ServiceError } from '@/services/supabase/client'
import { Button } from '@/components/ui/Button'
import { ScreenHeader } from '@/components/layout/ScreenHeader'

const RESEND_SECONDS = 30

/**
 * Guest mobile verification.
 *
 * Verifying is worth something concrete — the number is reused to prefill every
 * enquiry — but it is never a wall. If the backend has no SMS provider (the
 * current state of this project) the screen says so plainly and hands the guest
 * a Continue button, because an app that cannot get past its own first screen
 * is worse than an unverified number.
 */
export default function GuestVerify() {
  const navigate = useNavigate()
  const location = useLocation()
  const { choose } = useEntry()

  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const [step, setStep] = useState<'phone' | 'code' | 'unavailable'>('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [seconds, setSeconds] = useState(0)
  const codeRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (seconds <= 0) return
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [seconds])

  /** Finish as a guest and go wherever they were headed. */
  function enter(verified: boolean) {
    choose({
      choice: 'guest',
      phone: isValidIndianMobile(phone) ? normaliseMobile(phone) : null,
      phoneVerified: verified,
    })
    navigate(from, { replace: true })
  }

  async function send() {
    setError(null)
    setBusy(true)
    try {
      await sendMobileOtp(phone)
      setStep('code')
      setSeconds(RESEND_SECONDS)
      setTimeout(() => codeRef.current?.focus(), 50)
    } catch (err) {
      if (err instanceof ServiceError && err.code === 'unsupported') setStep('unavailable')
      else setError(err instanceof ServiceError ? err.message : 'Could not send the code.')
    } finally {
      setBusy(false)
    }
  }

  async function verify() {
    setError(null)
    setBusy(true)
    try {
      await verifyMobileOtp(phone, code)
      enter(true)
    } catch (err) {
      if (err instanceof ServiceError && err.code === 'unsupported') setStep('unavailable')
      else setError(err instanceof ServiceError ? err.message : 'Could not verify the code.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <ScreenHeader title="Verify Mobile" back />
      <div className="px-4">
        <div className="mb-5 flex items-center gap-3 rounded-[var(--radius-card)] border border-line bg-surface-2 p-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--color-primary)] text-white">
            <ShieldCheck className="h-5 w-5" aria-hidden />
          </span>
          <p className="text-sm text-ink-soft">
            We use your mobile number so vendors can call you back about an enquiry. It is never
            shown publicly on the app.
          </p>
        </div>

        {step === 'unavailable' ? (
          <section>
            <p className="flex items-start gap-2 rounded-[var(--radius-field)] bg-[var(--color-accent-100)] p-3 text-sm text-ink-soft">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
              SMS verification isn&apos;t switched on yet. You can continue as a guest — browsing,
              shortlisting and enquiries all work exactly the same.
            </p>
            <Button fullWidth className="mt-4" onClick={() => enter(false)}>
              Continue as Guest
            </Button>
          </section>
        ) : step === 'phone' ? (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (isValidIndianMobile(phone)) void send()
              else setError('Enter a valid 10-digit mobile number.')
            }}
            noValidate
          >
            <label htmlFor="mobile" className="mb-1.5 block text-sm font-semibold text-ink">
              Mobile number
            </label>
            <div className="flex items-center gap-2 rounded-[var(--radius-field)] border border-line bg-surface px-3 py-3 focus-within:border-[var(--color-primary)]">
              <Phone className="h-4 w-4 text-muted" aria-hidden />
              <span className="tnum text-[15px] font-semibold text-ink-soft">+91</span>
              <input
                id="mobile"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="98765 43210"
                className="tnum w-full bg-transparent text-[15px] tracking-wide outline-none"
              />
            </div>

            {error && (
              <p className="mt-3 rounded-[var(--radius-field)] bg-danger/10 p-3 text-sm text-danger">
                {error}
              </p>
            )}

            <Button
              type="submit"
              fullWidth
              className="mt-4"
              loading={busy}
              disabled={!isValidIndianMobile(phone)}
            >
              <MessageSquare className="h-4 w-4" /> Send Code
            </Button>
            <button
              type="button"
              onClick={() => enter(false)}
              className="w-full py-3 text-center text-sm font-semibold text-muted"
            >
              Skip for now
            </button>
          </form>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void verify()
            }}
            noValidate
          >
            <p className="mb-3 text-sm text-ink-soft">
              Enter the {OTP_LENGTH}-digit code sent to{' '}
              <span className="tnum font-semibold text-ink">+91 {phone}</span>{' '}
              <button
                type="button"
                onClick={() => {
                  setStep('phone')
                  setCode('')
                  setError(null)
                }}
                className="font-semibold text-[var(--color-primary)]"
              >
                Change
              </button>
            </p>

            <label htmlFor="otp" className="mb-1.5 block text-sm font-semibold text-ink">
              Verification code
            </label>
            <input
              id="otp"
              ref={codeRef}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={OTP_LENGTH}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH))}
              placeholder={'•'.repeat(OTP_LENGTH)}
              className="tnum w-full rounded-[var(--radius-field)] border border-line bg-surface px-4 py-3 text-center text-xl font-bold tracking-[0.4em] outline-none focus:border-[var(--color-primary)]"
            />

            {error && (
              <p className="mt-3 rounded-[var(--radius-field)] bg-danger/10 p-3 text-sm text-danger">
                {error}
              </p>
            )}

            <Button
              type="submit"
              fullWidth
              className="mt-4"
              loading={busy}
              disabled={code.length !== OTP_LENGTH}
            >
              Verify &amp; Continue
            </Button>
            <button
              type="button"
              disabled={seconds > 0 || busy}
              onClick={() => void send()}
              className="w-full py-3 text-center text-sm font-semibold text-[var(--color-primary)] disabled:text-muted"
            >
              {seconds > 0 ? `Resend code in ${seconds}s` : 'Resend code'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
