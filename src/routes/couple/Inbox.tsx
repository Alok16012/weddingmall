import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MessagesSquare, Send } from 'lucide-react'
import { listConversations, listMessages, markThreadRead, sendMessage } from '@/services/messages'
import { useCapability } from '@/hooks/useCapability'
import { useSession } from '@/auth/SessionContext'
import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/states'
import { BackendSetupNotice } from '@/components/BackendSetupNotice'
import { buttonClasses } from '@/components/ui/Button'
import { cn } from '@/lib/cn'

/**
 * Inbox — one thread per vendor, so a conversation always has a listing behind
 * it. Threads and messages are rows in Postgres, which is what makes the same
 * inbox appear on the website and in both apps without a sync layer.
 */
export function InboxList() {
  const enabled = useCapability('messages')
  const { userId } = useSession()

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['conversations'],
    queryFn: listConversations,
    enabled: enabled === true,
    retry: false,
  })

  return (
    <div className="pb-6">
      <ScreenHeader title="Inbox" subtitle="Your conversations with vendors" />

      {enabled === undefined && (
        <div className="space-y-3 px-4 pt-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[76px] w-full" />
          ))}
        </div>
      )}

      {enabled === false && (
        <BackendSetupNotice feature="Inbox messaging">
          <Link to="/vendors" className={buttonClasses({ size: 'sm' })}>
            Browse vendors
          </Link>
        </BackendSetupNotice>
      )}

      {enabled === true && (
        <div className="px-4 pt-4">
          {isLoading && (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-[76px] w-full" />
              ))}
            </div>
          )}
          {isError && <ErrorState onRetry={() => refetch()} message={(error as Error)?.message} />}

          {!isLoading && !isError && !userId && (
            <EmptyState
              icon={<MessagesSquare className="h-7 w-7" />}
              title="Verify your mobile to use Inbox"
              description="Messages are tied to your account so the same conversation is there on every device."
              action={
                <Link to="/welcome/verify" className={buttonClasses({ size: 'sm' })}>
                  Verify mobile
                </Link>
              }
            />
          )}

          {!isLoading && !isError && userId && data?.length === 0 && (
            <EmptyState
              icon={<MessagesSquare className="h-7 w-7" />}
              title="No messages yet"
              description="Send an enquiry and the vendor's reply will land here."
              action={
                <Link to="/venues" className={buttonClasses({ size: 'sm' })}>
                  Find a venue
                </Link>
              }
            />
          )}

          <ul className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface empty:hidden">
            {data?.map((c) => (
              <li key={c.id}>
                <Link to={`/inbox/${c.id}`} className="tap flex items-center gap-3 px-4 py-3.5 hover:bg-surface-2">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-2 text-ink-soft">
                    <MessagesSquare className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate font-semibold text-ink">
                        {c.vendorName ?? 'Vendor'}
                      </span>
                      {c.unreadCount > 0 && (
                        <span className="tnum shrink-0 rounded-full bg-[var(--color-primary)] px-1.5 py-0.5 text-[10px] font-bold text-white">
                          {c.unreadCount} new
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-muted">
                      {c.lastMessage ?? 'No messages yet'}
                    </span>
                  </span>
                  {c.lastMessageAt && (
                    <span className="tnum shrink-0 text-xs text-muted">
                      {new Date(c.lastMessageAt).toLocaleDateString()}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/** One conversation. */
export function InboxThread() {
  const { id = '' } = useParams()
  const enabled = useCapability('messages')
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['messages', id],
    queryFn: () => listMessages(id),
    enabled: enabled === true && !!id,
    retry: false,
  })

  // Opening the thread is what marks it read — not merely receiving it.
  useEffect(() => {
    if (enabled === true && id) void markThreadRead(id).then(() => {
      void queryClient.invalidateQueries({ queryKey: ['conversations'] })
    })
  }, [enabled, id, queryClient])

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [data?.length])

  const send = useMutation({
    mutationFn: (body: string) => sendMessage(id, body),
    onSuccess: () => {
      setDraft('')
      void queryClient.invalidateQueries({ queryKey: ['messages', id] })
      void queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })

  if (enabled === false) {
    return (
      <div className="pb-6">
        <ScreenHeader title="Conversation" back />
        <BackendSetupNotice feature="Inbox messaging" />
      </div>
    )
  }

  return (
    <div className="flex min-h-[100svh] flex-col">
      <ScreenHeader title="Conversation" back />

      <div className="flex-1 space-y-2 px-4 py-4">
        {isLoading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-12 w-2/3" />)}
        {isError && <ErrorState onRetry={() => refetch()} />}
        {data?.map((m) => (
          <div
            key={m.id}
            className={cn(
              'max-w-[80%] rounded-[var(--radius-card)] px-3.5 py-2.5 text-sm',
              m.sender === 'customer'
                ? 'ml-auto bg-[var(--color-primary)] text-white'
                : 'bg-surface-2 text-ink',
            )}
          >
            <p className="whitespace-pre-wrap break-words">{m.body}</p>
            <p
              className={cn(
                'tnum mt-1 text-[10px]',
                m.sender === 'customer' ? 'text-white/70' : 'text-muted',
              )}
            >
              {new Date(m.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (draft.trim()) send.mutate(draft)
        }}
        className="sticky bottom-0 flex items-end gap-2 border-t border-line bg-surface px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]"
      >
        <label className="sr-only" htmlFor="reply">
          Your message
        </label>
        <textarea
          id="reply"
          rows={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a message"
          className="max-h-28 min-h-[44px] flex-1 resize-y rounded-[var(--radius-field)] border border-line bg-canvas px-3.5 py-2.5 text-[15px] outline-none focus:border-[var(--color-primary)]"
        />
        <button
          type="submit"
          disabled={!draft.trim() || send.isPending}
          aria-label="Send message"
          className="tap grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius-field)] bg-[var(--color-primary)] text-white disabled:opacity-50"
        >
          <Send className="h-5 w-5" aria-hidden />
        </button>
      </form>

      {send.isError && (
        <p role="alert" className="px-4 pb-3 text-sm text-[var(--color-primary)]">
          {(send.error as Error).message}
        </p>
      )}
    </div>
  )
}
