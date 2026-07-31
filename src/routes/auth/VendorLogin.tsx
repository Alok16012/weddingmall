import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound, Mail, Store } from 'lucide-react'
import { useSession } from '@/auth/SessionContext'
import { ServiceError } from '@/services/supabase/client'
import { Button } from '@/components/ui/Button'
import { ScreenHeader } from '@/components/layout/ScreenHeader'

/**
 * Vendor sign-in. This backend enables EMAIL auth only (`phone: false`), and all
 * existing accounts are vendor business emails. Customers never need an account.
 */
export default function VendorLogin() {
  const navigate = useNavigate()
  const { signIn, sendPasswordReset } = useSession()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setNotice(null)
    setBusy(true)
    try {
      await signIn(email, password)
      navigate('/vendor', { replace: true })
    } catch (err) {
      setError(err instanceof ServiceError ? err.message : 'Could not sign in.')
    } finally {
      setBusy(false)
    }
  }

  async function reset() {
    setError(null)
    setNotice(null)
    try {
      await sendPasswordReset(email)
      setNotice('If that email is registered, a reset link is on its way.')
    } catch (err) {
      setError(err instanceof ServiceError ? err.message : 'Could not send reset email.')
    }
  }

  return (
    <div>
      <ScreenHeader title="Vendor Sign In" back />
      <div className="px-4">
        <div className="mb-5 flex items-center gap-3 rounded-[var(--radius-card)] border border-line bg-surface-2 p-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--color-primary)] text-white">
            <Store className="h-5 w-5" aria-hidden />
          </span>
          <p className="text-sm text-ink-soft">
            Sign in with the business email registered on WeddingMall to manage your enquiries.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-ink">
              Business email
            </label>
            <div className="flex items-center gap-2 rounded-[var(--radius-field)] border border-line bg-surface px-3 py-3 focus-within:border-[var(--color-primary)]">
              <Mail className="h-4 w-4 text-muted" aria-hidden />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="contact@yourvenue.com"
                className="w-full bg-transparent text-[15px] outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-ink">
              Password
            </label>
            <div className="flex items-center gap-2 rounded-[var(--radius-field)] border border-line bg-surface px-3 py-3 focus-within:border-[var(--color-primary)]">
              <KeyRound className="h-4 w-4 text-muted" aria-hidden />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Your password"
                className="w-full bg-transparent text-[15px] outline-none"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-[var(--radius-field)] bg-danger/10 p-3 text-sm text-danger">{error}</p>
          )}
          {notice && (
            <p className="rounded-[var(--radius-field)] bg-success-100 p-3 text-sm text-success">{notice}</p>
          )}

          <Button type="submit" fullWidth loading={busy}>
            Sign In
          </Button>

          <button
            type="button"
            onClick={reset}
            className="w-full py-2 text-center text-sm font-semibold text-[var(--color-primary)]"
          >
            Forgot password?
          </button>
        </form>
      </div>
    </div>
  )
}
