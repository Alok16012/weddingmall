import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

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
    <header className="sticky top-0 z-30 flex items-center gap-3 bg-canvas/95 px-4 py-3 backdrop-blur">
      {back && (
        <button
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="tap -ml-2 grid h-10 w-10 place-items-center rounded-full text-ink hover:bg-surface-2"
        >
          <ChevronLeft className="h-6 w-6" aria-hidden />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-xl font-semibold text-ink">{title}</h1>
        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      </div>
      {right}
    </header>
  )
}
