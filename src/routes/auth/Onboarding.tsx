import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CalendarHeart, Heart, ShieldCheck, Store, Users } from 'lucide-react'
import type { Role } from '@/types/domain'
import { Logo } from '@/components/Brand'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'

const SLIDES = [
  { icon: Heart, title: 'Discover the best vendors', body: 'Venues, makeup, photography, catering and more — verified and near you.' },
  { icon: ShieldCheck, title: 'Enquire with confidence', body: 'Transparent pricing and verified vendors. Your details stay private until you enquire.' },
  { icon: CalendarHeart, title: 'Plan it all in one place', body: 'Shortlist, chat, track bookings and your wedding checklist — together.' },
]

/** C-02 — value explanation + role selection, then hand off to OTP auth. */
export default function Onboarding() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'
  const [i, setI] = useState(0)
  const [role, setRole] = useState<Role>('couple')
  const slide = SLIDES[i]
  const last = i === SLIDES.length - 1

  return (
    <div className="mx-auto flex min-h-[100svh] max-w-md flex-col bg-canvas px-6 pb-8 pt-6">
      <div className="flex items-center justify-between">
        <Logo />
        <button onClick={() => navigate('/auth', { state: { from, role } })} className="text-sm font-semibold text-muted">
          Skip
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="mb-6 grid h-24 w-24 place-items-center rounded-[var(--radius-hero)] gradient-primary text-white">
          <slide.icon className="h-11 w-11" aria-hidden />
        </div>
        <h1 className="text-2xl font-semibold text-ink">{slide.title}</h1>
        <p className="mt-2 max-w-xs text-[15px] text-muted">{slide.body}</p>

        <div className="mt-6 flex gap-2" role="tablist" aria-label="Onboarding progress">
          {SLIDES.map((_, idx) => (
            <span key={idx} className={cn('h-2 rounded-full transition-all', idx === i ? 'w-6 bg-coral' : 'w-2 bg-line')} />
          ))}
        </div>
      </div>

      {last && (
        <div className="mb-4">
          <p className="mb-2 text-center text-sm font-semibold text-ink">I&apos;m here as a…</p>
          <div className="grid grid-cols-2 gap-3">
            <RoleCard active={role === 'couple'} onClick={() => setRole('couple')} icon={<Users className="h-5 w-5" />} label="Couple" />
            <RoleCard active={role === 'vendor'} onClick={() => setRole('vendor')} icon={<Store className="h-5 w-5" />} label="Vendor" />
          </div>
        </div>
      )}

      <Button fullWidth size="lg" onClick={() => (last ? navigate('/auth', { state: { from, role } }) : setI((n) => n + 1))}>
        {last ? 'Continue' : 'Next'}
      </Button>
    </div>
  )
}

function RoleCard({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex flex-col items-center gap-2 rounded-[var(--radius-card)] border-2 p-4 transition',
        active ? 'border-coral bg-coral-100 text-coral-600' : 'border-line bg-surface text-ink-soft',
      )}
    >
      {icon}
      <span className="font-semibold">{label}</span>
    </button>
  )
}
