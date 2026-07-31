import { useState } from 'react'
import { Heart, Info, ShieldCheck, Trash2 } from 'lucide-react'
import { clearFavourites } from '@/services/favourites'
import { useFavourites } from '@/hooks/useFavourites'
import { Button } from '@/components/ui/Button'
import { ScreenHeader } from '@/components/layout/ScreenHeader'

/**
 * Privacy & data. This app stores no customer account — the only on-device data
 * is the shortlist and the selected city, both clearable here.
 */
export default function Privacy() {
  const { count } = useFavourites()
  const [cleared, setCleared] = useState(false)

  function clearLocal() {
    clearFavourites()
    localStorage.removeItem('wm.city')
    window.dispatchEvent(new Event('wm:favourites-changed'))
    window.dispatchEvent(new Event('wm:city-changed'))
    setCleared(true)
  }

  return (
    <div className="pb-8">
      <ScreenHeader title="Privacy & Data" back />
      <div className="space-y-4 px-4">
        <section className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
          <div className="flex items-center gap-2 text-ink">
            <ShieldCheck className="h-5 w-5 text-success" aria-hidden />
            <h2 className="text-lg">What we collect</h2>
          </div>
          <ul className="mt-2 space-y-2 text-sm text-ink-soft">
            <li className="flex gap-2">
              <span className="text-muted">•</span>
              <span>
                <strong className="text-ink">Enquiries.</strong> Your name, mobile number and
                optional wedding date — shared only with the vendor you contact.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-muted">•</span>
              <span>
                <strong className="text-ink">On this device.</strong> Your shortlist and selected
                city. Never uploaded.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-muted">•</span>
              <span>
                <strong className="text-ink">No customer account.</strong> Browsing and enquiring
                need no sign-up, so there is no customer profile to delete.
              </span>
            </li>
          </ul>
        </section>

        <section className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
          <div className="flex items-center gap-2 text-ink">
            <Heart className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
            <h2 className="text-lg">Data on this device</h2>
          </div>
          <p className="mt-1 text-sm text-muted">
            {count} shortlisted vendor{count === 1 ? '' : 's'} and your city preference.
          </p>
          {cleared ? (
            <p className="mt-3 rounded-[var(--radius-field)] bg-success-100 p-3 text-sm text-success">
              On-device data cleared.
            </p>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="mt-3 border-danger text-danger"
              leftIcon={<Trash2 className="h-4 w-4" />}
              onClick={clearLocal}
            >
              Clear on-device data
            </Button>
          )}
        </section>

        <p className="flex items-start gap-2 rounded-[var(--radius-card)] bg-surface-2 p-3 text-xs text-muted">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          Vendor accounts are managed by WeddingMall. To delete a vendor account or an enquiry
          record, contact support via weddingmall.online.
        </p>
      </div>
    </div>
  )
}
