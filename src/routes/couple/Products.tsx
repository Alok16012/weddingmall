import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MapPin, Phone, ShoppingBag, X } from 'lucide-react'
import { PRODUCT_LABELS, type ProductCategory, type ProductItem } from '@/types/domain'
import { repositories } from '@/repositories'
import { formatINR } from '@/lib/format'
import { cn } from '@/lib/cn'
import { Stars } from '@/components/ui/Stars'
import { buttonClasses } from '@/components/ui/Button'
import { EmptyState, Skeleton } from '@/components/ui/states'
import { ScreenHeader } from '@/components/layout/ScreenHeader'

export default function Products() {
  const [params, setParams] = useSearchParams()
  const category = (params.get('category') as ProductCategory | null) ?? undefined
  const [active, setActive] = useState<ProductItem | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['products', category ?? 'all'],
    queryFn: () => repositories.products.list(category),
  })

  function setCategory(next?: ProductCategory) {
    const p = new URLSearchParams(params)
    if (next) p.set('category', next)
    else p.delete('category')
    setParams(p, { replace: true })
  }

  return (
    <div className="pb-8">
      <ScreenHeader title="Wedding Products" subtitle="Shop invitations, wear, jewellery & more" back />

      {/* Category chips */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-1">
        <Chip active={!category} onClick={() => setCategory(undefined)}>All</Chip>
        {(Object.keys(PRODUCT_LABELS) as ProductCategory[]).map((c) => (
          <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
            {PRODUCT_LABELS[c]}
          </Chip>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3 px-4 pt-3">
        {isLoading &&
          [0, 1, 2, 3].map((i) => (
            <div key={i} className="overflow-hidden rounded-[var(--radius-card)] bg-surface shadow-[var(--shadow-card)]">
              <Skeleton className="h-36 w-full rounded-none" />
              <div className="space-y-2 p-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        {!isLoading && data?.length === 0 && (
          <div className="col-span-2">
            <EmptyState icon={<ShoppingBag className="h-7 w-7" />} title="No products here yet" description="Try another category." />
          </div>
        )}
        {data?.map((p) => (
          <button
            key={p.id}
            onClick={() => setActive(p)}
            className="card-interactive overflow-hidden rounded-[var(--radius-card)] bg-surface text-left shadow-[var(--shadow-card)]"
          >
            <img src={p.image.url} alt={p.image.alt} loading="lazy" className="h-36 w-full object-cover" />
            <div className="p-3">
              <h3 className="line-clamp-2 text-sm font-semibold text-ink">{p.name}</h3>
              <p className="mt-0.5 text-xs text-muted">{p.seller}</p>
              <div className="mt-1.5 flex items-center justify-between">
                <span className="tnum text-sm font-bold text-coral">{formatINR(p.price.minorUnits, { compact: true })}</span>
                <Stars rating={p.rating} />
              </div>
            </div>
          </button>
        ))}
      </div>

      {active && <ProductSheet product={active} onClose={() => setActive(null)} />}
    </div>
  )
}

function Chip({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-[var(--radius-pill)] border px-3.5 py-2 text-sm font-medium',
        active ? 'border-coral bg-coral-100 text-coral-600' : 'border-line bg-surface text-ink',
      )}
    >
      {children}
    </button>
  )
}

function ProductSheet({ product, onClose }: { product: ProductItem; onClose: () => void }) {
  return (
    <div className="anim-backdrop-in fixed inset-0 z-50 flex items-end bg-black/50" onClick={onClose} role="dialog" aria-modal="true" aria-label={product.name}>
      <div
        className="anim-panel-in mx-auto w-full max-w-md rounded-t-[var(--radius-hero)] bg-canvas p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" />
        <button onClick={onClose} aria-label="Close" className="tap absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-surface">
          <X className="h-5 w-5" aria-hidden />
        </button>
        <img src={product.image.url} alt={product.image.alt} className="h-44 w-full rounded-[var(--radius-card)] object-cover" />
        <h2 className="mt-3 text-xl font-semibold text-ink">{product.name}</h2>
        <div className="mt-1 flex items-center gap-3 text-sm text-muted">
          <span className="flex items-center gap-1"><MapPin className="h-4 w-4" aria-hidden /> {product.seller} · {product.city}</span>
          <Stars rating={product.rating} count={product.reviewCount} />
        </div>
        <p className="mt-3 text-[15px] text-ink-soft">{product.description}</p>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted">Price</p>
            <p className="tnum text-2xl font-semibold text-ink">
              {formatINR(product.price.minorUnits)}
              {product.price.unit && <span className="ml-1 text-sm font-normal text-muted">{product.price.unit}</span>}
            </p>
          </div>
          <a href="tel:+910000000000" className={buttonClasses({ className: 'px-6' })}>
            <Phone className="h-4 w-4" /> Contact seller
          </a>
        </div>
      </div>
    </div>
  )
}
