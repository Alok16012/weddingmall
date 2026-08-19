import { Link } from 'react-router-dom'
import { DatabaseZap } from 'lucide-react'
import { EMAIL } from '@/config/company'

/**
 * Shown where a screen is fully built but the Supabase project it talks to has
 * not had `supabase/migrations/0001_marketplace_workflows.sql` applied yet.
 *
 * The alternative would be to fill the screen with invented rows, which would
 * misrepresent the product to whoever is looking at it. This says plainly that
 * the feature is waiting on a backend step, and keeps the parts that do work
 * one tap away.
 */
export function BackendSetupNotice({
  feature,
  children,
}: {
  feature: string
  children?: React.ReactNode
}) {
  return (
    <div className="px-4 py-10 text-center">
      <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-surface-2 text-muted">
        <DatabaseZap className="h-7 w-7" aria-hidden />
      </div>
      <h3 className="text-lg font-semibold text-ink">{feature} isn’t switched on yet</h3>
      <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted">
        This part of {feature.toLowerCase()} is ready in the app but needs to be enabled on our
        servers first. Everything else keeps working in the meantime.
      </p>
      <div className="mt-5 flex flex-col items-center gap-2">
        {children}
        <Link to="/contact" className="text-sm font-semibold text-[var(--color-primary)]">
          Contact us
        </Link>
        <p className="text-xs text-muted">{EMAIL}</p>
      </div>
    </div>
  )
}
