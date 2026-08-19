import { Globe, Mail, MapPin, Navigation, Phone } from 'lucide-react'
import {
  ADDRESS,
  BRAND_NAME,
  EMAIL,
  LEGAL_NAME,
  MAP_URL,
  PHONES,
  PROPOSITION,
  TAGLINE,
  WEBSITE_LABEL,
  WEBSITE_URL,
} from '@/config/company'
import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { Logo } from '@/components/Brand'

/**
 * Contact & About.
 *
 * The company details live here rather than on Home, which the brief asks to
 * keep uncluttered. Everything is an action: the numbers dial, the address
 * opens directions, the email opens a composer — `tel:`, `mailto:` and a Google
 * Maps universal link all resolve to the platform's own handler inside the
 * Android and iOS WebViews exactly as they do in a browser.
 */
export default function Contact() {
  return (
    <div className="pb-10">
      <ScreenHeader title="Contact us" subtitle={BRAND_NAME} back />

      <div className="space-y-5 px-4 pt-4">
        <section className="rounded-[var(--radius-card)] border border-line bg-surface-2 p-4">
          <Logo className="mb-2" />
          <p className="text-sm font-semibold text-ink">{PROPOSITION}</p>
          <p className="mt-1 text-sm text-ink-soft">{TAGLINE}</p>
        </section>

        <section aria-labelledby="reach-us" className="space-y-2">
          <h2 id="reach-us" className="px-1 text-xs font-bold uppercase tracking-wide text-muted">
            Reach us
          </h2>
          <div className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
            {PHONES.map((p) => (
              <a
                key={p.e164}
                href={`tel:${p.e164}`}
                className="tap flex items-center gap-3 border-b border-line px-4 py-3.5 last:border-0 hover:bg-surface-2"
              >
                <Phone className="h-5 w-5 shrink-0 text-ink-soft" aria-hidden />
                <span className="tnum flex-1 font-medium text-ink">{p.display}</span>
                <span className="text-sm text-muted">Call</span>
              </a>
            ))}
            <a
              href={`mailto:${EMAIL}`}
              className="tap flex items-center gap-3 border-b border-line px-4 py-3.5 last:border-0 hover:bg-surface-2"
            >
              <Mail className="h-5 w-5 shrink-0 text-ink-soft" aria-hidden />
              <span className="min-w-0 flex-1 truncate font-medium text-ink">{EMAIL}</span>
              <span className="text-sm text-muted">Email</span>
            </a>
            <a
              href={WEBSITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="tap flex items-center gap-3 px-4 py-3.5 hover:bg-surface-2"
            >
              <Globe className="h-5 w-5 shrink-0 text-ink-soft" aria-hidden />
              <span className="min-w-0 flex-1 truncate font-medium text-ink">{WEBSITE_LABEL}</span>
              <span className="text-sm text-muted">Visit</span>
            </a>
          </div>
        </section>

        <section aria-labelledby="office" className="space-y-2">
          <h2 id="office" className="px-1 text-xs font-bold uppercase tracking-wide text-muted">
            Registered office
          </h2>
          <div className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
            <p className="flex gap-3 text-sm leading-relaxed text-ink">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-ink-soft" aria-hidden />
              <span>
                <span className="font-semibold">{LEGAL_NAME}</span>
                <br />
                {ADDRESS.line1}
                <br />
                {ADDRESS.line2}
                <br />
                {ADDRESS.country}
              </span>
            </p>
            <a
              href={MAP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="tap mt-3 inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius-field)] border border-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--color-primary)]"
            >
              <Navigation className="h-4 w-4" aria-hidden /> Get directions
            </a>
          </div>
        </section>

        <p className="px-1 text-xs leading-relaxed text-muted">
          {BRAND_NAME} is operated by {LEGAL_NAME}. Listings, enquiries and bookings are shared
          across our website and apps, so whichever you use, you see the same information.
        </p>
      </div>
    </div>
  )
}
