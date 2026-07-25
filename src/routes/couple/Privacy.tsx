import { useState } from 'react'
import { Bell, MapPin, Camera, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { ScreenHeader } from '@/components/layout/ScreenHeader'

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`tap relative h-7 w-12 rounded-full transition ${on ? 'gradient-primary' : 'bg-line'}`}
    >
      <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-6' : 'left-1'}`} />
    </button>
  )
}

export default function Privacy() {
  const [loc, setLoc] = useState(true)
  const [photos, setPhotos] = useState(false)
  const [push, setPush] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div className="pb-8">
      <ScreenHeader title="Privacy & Permissions" back />
      <div className="space-y-3 px-4">
        <PermRow icon={<MapPin className="h-5 w-5" />} title="Location" desc="Used to show vendors near you. You can pick a city manually instead.">
          <Toggle on={loc} onChange={setLoc} />
        </PermRow>
        <PermRow icon={<Camera className="h-5 w-5" />} title="Photos & camera" desc="Only used when you attach images to an enquiry or review.">
          <Toggle on={photos} onChange={setPhotos} />
        </PermRow>
        <PermRow icon={<Bell className="h-5 w-5" />} title="Push notifications" desc="Vendor replies, quotes and booking updates.">
          <Toggle on={push} onChange={setPush} />
        </PermRow>

        <section className="mt-6 rounded-[var(--radius-card)] border border-danger/20 bg-danger/5 p-4">
          <div className="flex items-center gap-2 text-danger">
            <Trash2 className="h-5 w-5" aria-hidden />
            <h3 className="font-semibold">Delete account</h3>
          </div>
          <p className="mt-2 text-sm text-ink-soft">
            This requests permanent deletion. For your security you’ll be asked to re-authenticate. Data is
            removed or anonymised per our retention policy; some records are kept where legally required.
          </p>
          {!confirmDelete ? (
            <Button variant="outline" className="mt-3 border-danger text-danger" onClick={() => setConfirmDelete(true)}>
              Request account deletion
            </Button>
          ) : (
            <div className="mt-3 flex gap-2">
              <Button variant="ghost" onClick={() => setConfirmDelete(false)}>Cancel</Button>
              <Button className="bg-danger" onClick={() => alert('In production this triggers a recent-auth check, then a server-side deletion request.')}>
                Confirm deletion
              </Button>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function PermRow({ icon, title, desc, children }: { icon: ReactNode; title: string; desc: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-[var(--radius-card)] bg-surface p-4 shadow-[var(--shadow-card)]">
      <span className="mt-0.5 text-coral">{icon}</span>
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-ink">{title}</h3>
        <p className="text-sm text-muted">{desc}</p>
      </div>
      {children}
    </div>
  )
}
