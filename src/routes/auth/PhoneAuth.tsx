import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Phone } from 'lucide-react'
import type { Role } from '@/types/domain'
import { useSession } from '@/auth/SessionContext'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/Brand'
import { ScreenHeader } from '@/components/layout/ScreenHeader'

const RESEND_SECONDS = 30

/** AUTH-01 — phone OTP sign-in. Indian mobile (10 digits), 6-digit code, resend timer. */
export default function PhoneAuth() {
  const { requestOtp, verifyOtp, switchRole } = useSession()
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state as { from?: string; role?: Role } | null) ?? {}
  const from = state.from ?? '/'
  const role = state.role ?? 'couple'

  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [digits, setDigits] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const timerRef = useRef<number | null>(null)

  const phoneValid = /^\d{10}$/.test(digits)
  const otpValid = /^\d{6}$/.test(otp)
  const e164 = `+91${digits}`

  useEffect(() => () => { if (timerRef.current) window.clearInterval(timerRef.current) }, [])

  function startCountdown() {
    setSecondsLeft(RESEND_SECONDS)
    if (timerRef.current) window.clearInterval(timerRef.current)
    timerRef.current = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1 && timerRef.current) window.clearInterval(timerRef.current)
        return s - 1
      })
    }, 1000)
  }

  async function sendOtp() {
    if (!phoneValid) return setError('Enter a valid 10-digit mobile number')
    setError(null)
    setBusy(true)
    try {
      await requestOtp(e164)
      setStep('otp')
      startCountdown()
    } catch (e) {
      setError(friendly(e))
    } finally {
      setBusy(false)
    }
  }

  async function verify() {
    if (!otpValid) return setError('Enter the 6-digit code')
    setError(null)
    setBusy(true)
    try {
      await verifyOtp(e164, otp)
      if (role === 'vendor') switchRole('vendor')
      navigate(role === 'vendor' ? '/vendor' : from, { replace: true })
    } catch (e) {
      setError(friendly(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto min-h-[100svh] max-w-md bg-canvas">
      <ScreenHeader title="" back />
      <div className="px-6">
        <Logo className="mb-6" />

        {step === 'phone' ? (
          <>
            <h1 className="text-2xl font-semibold text-ink">Enter your mobile number</h1>
            <p className="mt-1 text-sm text-muted">We&apos;ll send you a 6-digit verification code.</p>
            <div className="mt-6 flex items-center gap-2 rounded-[var(--radius-card)] border border-line bg-surface px-4 py-3 focus-within:border-coral">
              <Phone className="h-5 w-5 text-muted" aria-hidden />
              <span className="font-semibold text-ink">+91</span>
              <input
                autoFocus
                inputMode="numeric"
                maxLength={10}
                value={digits}
                onChange={(e) => setDigits(e.target.value.replace(/\D/g, '').slice(0, 10))}
                onKeyDown={(e) => e.key === 'Enter' && sendOtp()}
                placeholder="98765 43210"
                aria-label="Mobile number"
                className="tnum w-full bg-transparent text-lg tracking-wide outline-none"
              />
            </div>
            {error && <p className="mt-2 text-sm text-danger">{error}</p>}
            <Button fullWidth size="lg" className="mt-6" loading={busy} disabled={!phoneValid} onClick={sendOtp}>
              Send OTP
            </Button>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold text-ink">Verify your number</h1>
            <p className="mt-1 text-sm text-muted">
              Enter the code sent to <span className="font-semibold text-ink">+91 {digits}</span>{' '}
              <button onClick={() => setStep('phone')} className="font-semibold text-coral">Change</button>
            </p>
            <input
              autoFocus
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={(e) => e.key === 'Enter' && verify()}
              placeholder="••••••"
              aria-label="6-digit code"
              className="tnum mt-6 w-full rounded-[var(--radius-card)] border border-line bg-surface px-4 py-4 text-center text-2xl tracking-[0.5em] outline-none focus:border-coral"
            />
            {error && <p className="mt-2 text-sm text-danger">{error}</p>}
            <Button fullWidth size="lg" className="mt-6" loading={busy} disabled={!otpValid} onClick={verify}>
              Verify &amp; continue
            </Button>
            <button
              disabled={secondsLeft > 0}
              onClick={sendOtp}
              className="mt-4 w-full text-center text-sm font-semibold text-coral disabled:text-muted"
            >
              {secondsLeft > 0 ? `Resend code in ${secondsLeft}s` : 'Resend code'}
            </button>
          </>
        )}

        <p className="mt-8 text-center text-xs text-muted">
          By continuing you agree to our Terms &amp; Privacy Policy.
        </p>
      </div>
    </div>
  )
}

function friendly(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e)
  if (/provider|sms|not enabled|unsupported phone/i.test(msg))
    return 'SMS sign-in isn’t enabled on the backend yet. Configure an SMS provider in Supabase to receive codes.'
  if (/invalid|expired|token/i.test(msg)) return 'That code is invalid or expired. Please try again.'
  if (/rate|too many/i.test(msg)) return 'Too many attempts. Please wait a moment and retry.'
  return msg
}
