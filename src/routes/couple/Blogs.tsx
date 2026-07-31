import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getBlogBySlug, listBlogs } from '@/services/content'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/states'
import { ScreenHeader } from '@/components/layout/ScreenHeader'

export function BlogList() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['blogs'],
    queryFn: () => listBlogs(),
  })

  return (
    <div className="pb-6">
      <ScreenHeader title="Wedding Ideas" subtitle="Tips & inspiration" back />
      <div className="space-y-4 px-4 pt-1">
        {isLoading && [0, 1].map((i) => <Skeleton key={i} className="h-40 w-full" />)}
        {isError && <ErrorState onRetry={() => refetch()} />}
        {!isLoading && !data?.length && <EmptyState title="No articles yet" />}
        {data?.map((b) => (
          <Link
            key={b.id}
            to={`/blogs/${b.slug}`}
            className="card-interactive block overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface"
          >
            {b.image && <img src={b.image} alt="" className="h-40 w-full object-cover" />}
            <div className="p-4">
              {b.category && (
                <span className="text-xs font-bold uppercase tracking-wide text-[var(--color-accent)]">
                  {b.category}
                </span>
              )}
              <h3 className="mt-1 text-base font-bold text-ink">{b.title}</h3>
              {b.excerpt && <p className="mt-1 line-clamp-2 text-sm text-muted">{b.excerpt}</p>}
              {b.author && <p className="mt-2 text-xs text-muted">By {b.author}</p>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export function BlogDetail() {
  const { slug = '' } = useParams()
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['blog', slug],
    queryFn: () => getBlogBySlug(slug),
  })

  if (isLoading) {
    return (
      <div>
        <ScreenHeader title="" back />
        <div className="space-y-3 p-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    )
  }
  if (isError || !data) {
    return (
      <div>
        <ScreenHeader title="Article" back />
        <ErrorState onRetry={() => refetch()} message="This article could not be found." />
      </div>
    )
  }

  return (
    <div className="pb-10">
      <ScreenHeader title="" back />
      {data.image && (
        <img src={data.image} alt="" className="h-52 w-full object-cover" />
      )}
      <div className="px-4 pt-4">
        {data.category && (
          <span className="text-xs font-bold uppercase tracking-wide text-[var(--color-accent)]">
            {data.category}
          </span>
        )}
        <h1 className="mt-1 text-[1.75rem] leading-tight text-ink">{data.title}</h1>
        {data.author && <p className="mt-2 text-sm text-muted">By {data.author}</p>}
        {data.content && (
          <div className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-ink-soft">
            {data.content}
          </div>
        )}
      </div>
    </div>
  )
}
