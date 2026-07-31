import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound } from 'lucide-react'
import { updatePassword } from '@/services/auth'
import { ServiceError } from '@/services/supabase/client'
import { Button } from '@/components/ui/Button'
import { ScreenHeader } from '@/components/layout/ScreenHeader'

/** Landing screen for the password-reset deep link (Supabase recovery session). */
export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await updatePassword(password)
      setDone(true)
      setTimeout(() => navigate('/vendor', { replace: true }), 1200)
    } catch (err) {
      setError(err instanceof ServiceError ? err.message : 'Could not update password.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <ScreenHeader title="Set New Password" back />
      <form onSubmit={submit} className="space-y-4 px-4" noValidate>
        <p className="text-sm text-muted">Choose a new password for your vendor account.</p>
        <div className="flex items-center gap-2 rounded-[var(--radius-field)] border border-line bg-surface px-3 py-3 focus-within:border-[var(--color-primary)]">
          <KeyRound className="h-4 w-4 text-muted" aria-hidden />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            className="w-full bg-transparent text-[15px] outline-none"
          />
        </div>
        {error && (
          <p className="rounded-[var(--radius-field)] bg-danger/10 p-3 text-sm text-danger">{error}</p>
        )}
        {done && (
          <p className="rounded-[var(--radius-field)] bg-success-100 p-3 text-sm text-success">
            Password updated. Redirecting…
          </p>
        )}
        <Button type="submit" fullWidth loading={busy}>
          Update password
        </Button>
      </form>
    </div>
  )
}
