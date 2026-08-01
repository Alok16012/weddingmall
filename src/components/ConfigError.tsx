import { AlertTriangle } from 'lucide-react'

/**
 * Shown when the Supabase URL/anon key are missing, instead of letting every
 * screen fail with a vague "something went wrong". `.env.local` is gitignored,
 * so this is what a fresh clone or a mis-configured deploy hits.
 */
export function ConfigError() {
  return (
    <div className="mx-auto flex min-h-[100svh] max-w-md flex-col justify-center gap-4 bg-canvas px-6">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-[var(--color-primary-100)] text-[var(--color-primary)]">
        <AlertTriangle className="h-6 w-6" aria-hidden />
      </div>
      <h1 className="text-2xl text-ink">Backend not configured</h1>
      <p className="text-[15px] leading-relaxed text-ink-soft">
        The app can’t reach Supabase because its environment variables are missing. This is expected
        on a fresh clone — <code className="rounded bg-surface-2 px-1">.env.local</code> is
        intentionally not committed.
      </p>

      <div className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
        <p className="mb-2 text-sm font-bold text-ink">Fix — run in the project root:</p>
        <pre className="overflow-x-auto rounded-[var(--radius-field)] bg-surface-2 p-3 text-xs leading-relaxed text-ink-soft">
{`cp .env.example .env.local
# then add the values, and restart the dev server`}
        </pre>
        <p className="mt-3 text-xs text-muted">
          Required: <code>VITE_SUPABASE_URL</code> and{' '}
          <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> (the public anon key — never the service key).
          Find both in Supabase → Project Settings → API.
        </p>
      </div>

      <p className="text-xs text-muted">
        Deploying? Set the same two variables in your host’s environment settings (Vercel/Netlify →
        Environment Variables), then redeploy — Vite inlines them at build time.
      </p>
    </div>
  )
}
