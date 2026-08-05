import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { BRAND_NAME, LogoMark, Wordmark } from '@/components/Brand'

export function ScreenHeader({
  title,
  subtitle,
  back = false,
  right,
}: {
  title: string
  subtitle?: string
  back?: boolean
  right?: ReactNode
}) {
  const navigate = useNavigate()
  return (
    <header className="sticky top-0 z-30 border-b border-line flex items-center gap-3 bg-canvas/95 px-4 py-3 backdrop-blur">
      {back && (
        <button
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="tap -ml-2 grid h-10 w-10 place-items-center rounded-full text-ink hover:bg-surface-2"
        >
          <ChevronLeft className="h-6 w-6" aria-hidden />
        </button>
      )}
      <Link
        to="/"
        aria-label={`${BRAND_NAME} home`}
        className="tap inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full pr-1 hover:bg-surface-2"
      >
        <LogoMark className="h-7 w-7" />
        <Wordmark
          className={
            right
              ? 'hidden text-[13px] leading-none text-[var(--color-primary)] min-[540px]:inline'
              : 'hidden text-[13px] leading-none text-[var(--color-primary)] min-[360px]:inline'
          }
        />
      </Link>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[1.375rem] font-semibold text-ink">{title}</h1>
        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      </div>
      {right}
    </header>
  )
}
