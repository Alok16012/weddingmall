import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Check, CheckCheck, Clock, Paperclip, Send } from 'lucide-react'
import { repositories } from '@/repositories'
import type { Message, MessageState } from '@/types/domain'
import { cn } from '@/lib/cn'
import { ScreenHeader } from '@/components/layout/ScreenHeader'

function StateIcon({ state }: { state: MessageState }) {
  if (state === 'pending') return <Clock className="h-3.5 w-3.5 text-white/60" aria-label="sending" />
  if (state === 'failed') return <span className="text-[11px] text-red-200">failed · retry</span>
  if (state === 'read') return <CheckCheck className="h-3.5 w-3.5 text-white" aria-label="read" />
  if (state === 'delivered') return <CheckCheck className="h-3.5 w-3.5 text-white/60" aria-label="delivered" />
  return <Check className="h-3.5 w-3.5 text-white/60" aria-label="sent" />
}

export default function Chat() {
  const { conversationId = 'cnv1' } = useParams()
  const { data: initial } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => repositories.chat.messages(conversationId),
  })

  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (initial) setMessages(initial)
  }, [initial])
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function send() {
    const body = draft.trim()
    if (!body) return
    const optimistic: Message = {
      id: `local_${Date.now()}`,
      conversationId,
      senderId: 'you',
      body,
      state: 'pending',
      createdAt: new Date().toISOString(),
    }
    setMessages((m) => [...m, optimistic])
    setDraft('')
    // Simulate delivery lifecycle (real Supabase realtime replaces this in Phase 4).
    setTimeout(() => {
      setMessages((m) => m.map((x) => (x.id === optimistic.id ? { ...x, state: 'delivered' } : x)))
    }, 700)
  }

  return (
    <div className="flex h-[100svh] flex-col">
      <ScreenHeader title="Usha Resort" subtitle="Typically replies in 8 min" back />

      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
        {messages.map((m) => {
          const mine = m.senderId === 'you'
          return (
            <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[78%] rounded-2xl px-3.5 py-2 text-[15px]',
                  mine ? 'gradient-primary rounded-br-sm text-white' : 'rounded-bl-sm bg-surface text-ink shadow-[var(--shadow-card)]',
                )}
              >
                <p>{m.body}</p>
                <div className={cn('mt-0.5 flex items-center justify-end gap-1 text-[11px]', mine ? 'text-white/80' : 'text-muted')}>
                  {new Date(m.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  {mine && <StateIcon state={m.state} />}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={endRef} />
      </div>

      <div className="flex items-center gap-2 border-t border-line bg-surface p-3">
        <button aria-label="Attach file" className="tap grid h-11 w-11 place-items-center rounded-full text-muted hover:bg-surface-2">
          <Paperclip className="h-5 w-5" aria-hidden />
        </button>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Message…"
          className="h-11 flex-1 rounded-[var(--radius-pill)] border border-line bg-canvas px-4 text-[15px] outline-none focus:border-coral"
          aria-label="Message"
        />
        <button onClick={send} aria-label="Send" className="tap grid h-11 w-11 place-items-center rounded-full gradient-primary text-white">
          <Send className="h-5 w-5" aria-hidden />
        </button>
      </div>
    </div>
  )
}
