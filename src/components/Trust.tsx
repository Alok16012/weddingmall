import { BadgeCheck, HeartHandshake, Receipt, ShieldCheck } from 'lucide-react'
import type { ComponentType } from 'react'

/** Social proof — mirrors the messaging on weddingmall.online. */
const STATS: { value: string; label: string }[] = [
  { value: '1,000+', label: 'Verified vendors' },
  { value: '2,000+', label: 'Happy couples' },
  { value: '100+', label: 'Cities' },
]

export function TrustStrip() {
  return (
    <section
      aria-label="Why couples trust WeddingMall"
      className="grid grid-cols-3 divide-x divide-line rounded-[var(--radius-card)] border border-line bg-surface py-3"
    >
      {STATS.map((s) => (
        <div key={s.label} className="px-2 text-center">
          <div className="tnum text-lg font-bold text-ink">{s.value}</div>
          <div className="text-[11px] leading-tight text-muted">{s.label}</div>
        </div>
      ))}
    </section>
  )
}

const PILLARS: { icon: ComponentType<{ className?: string }>; title: string; desc: string }[] = [
  { icon: ShieldCheck, title: 'Verified & trusted', desc: 'Every vendor is checked before going live.' },
  { icon: Receipt, title: 'Transparent pricing', desc: 'Clear starting prices — no hidden costs.' },
  { icon: HeartHandshake, title: 'Dedicated support', desc: 'Real help from enquiry to your big day.' },
]

export function WhyWeddingMall() {
  return (
    <section>
      <h2 className="mb-3 px-4 text-xl text-ink">Why WeddingMall</h2>
      <div className="space-y-2.5 px-4">
        {PILLARS.map((p) => (
          <div
            key={p.title}
            className="flex items-start gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-success-100 text-success">
              <p.icon className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-bold text-ink">{p.title}</h3>
              <p className="text-sm text-muted">{p.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 flex items-center justify-center gap-1.5 px-4 text-xs text-muted">
        <BadgeCheck className="h-4 w-4 text-success" aria-hidden />
        100% secure · Contact details shared only after you enquire
      </p>
    </section>
  )
}
