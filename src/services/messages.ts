import type { Conversation, Message } from '@/types/domain'
import { requireSupabase, ServiceError, toServiceError } from './supabase/client'
import { hasCapability } from './supabase/capabilities'

/**
 * Inbox — one thread per couple per vendor.
 *
 * Backed by `conversations` + `messages` from migration 0001. Because the rows
 * live in Postgres and every platform reads the same project, a message sent on
 * Android is in the thread on the website without any further sync layer.
 */

interface ConversationRow {
  id: string
  vendor_id: string
  vendor_name: string | null
  booking_id: string | null
  last_message: string | null
  last_message_at: string | null
  messages?: { count: number }[]
}

interface MessageRow {
  id: string
  conversation_id: string
  sender: 'customer' | 'vendor'
  body: string
  created_at: string
  read_at: string | null
}

function unsupported(): never {
  throw new ServiceError(
    'Inbox needs the marketplace schema migration to be applied to this Supabase project.',
    'unsupported',
  )
}

/** Threads for the signed-in user, most recently active first. */
export async function listConversations(): Promise<Conversation[]> {
  if (!(await hasCapability('messages'))) unsupported()
  try {
    const supabase = requireSupabase()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return []

    const { data, error } = await supabase
      .from('conversations')
      .select('id,vendor_id,vendor_name,booking_id,last_message,last_message_at')
      .eq('user_id', auth.user.id)
      .order('last_message_at', { ascending: false, nullsFirst: false })
    if (error) throw error

    const rows = (data as unknown as ConversationRow[]) ?? []
    if (!rows.length) return []

    // Unread badges: one grouped count for all threads rather than per-thread
    // queries. Only the vendor's own messages can be unread for a customer.
    const { data: unread } = await supabase
      .from('messages')
      .select('conversation_id')
      .in('conversation_id', rows.map((r) => r.id))
      .eq('sender', 'vendor')
      .is('read_at', null)

    const counts = new Map<string, number>()
    for (const m of (unread as { conversation_id: string }[]) ?? []) {
      counts.set(m.conversation_id, (counts.get(m.conversation_id) ?? 0) + 1)
    }

    return rows.map((r) => ({
      id: r.id,
      vendorId: r.vendor_id,
      vendorName: r.vendor_name,
      bookingId: r.booking_id,
      lastMessage: r.last_message,
      lastMessageAt: r.last_message_at,
      unreadCount: counts.get(r.id) ?? 0,
    }))
  } catch (err) {
    throw toServiceError(err)
  }
}

export async function listMessages(conversationId: string): Promise<Message[]> {
  if (!(await hasCapability('messages'))) unsupported()
  try {
    const supabase = requireSupabase()
    const { data, error } = await supabase
      .from('messages')
      .select('id,conversation_id,sender,body,created_at,read_at')
      .eq('conversation_id', conversationId)
      .order('created_at')
    if (error) throw error
    return (data as unknown as MessageRow[]).map((r) => ({
      id: r.id,
      conversationId: r.conversation_id,
      sender: r.sender,
      body: r.body,
      createdAt: r.created_at,
      readAt: r.read_at,
    }))
  } catch (err) {
    throw toServiceError(err)
  }
}

/** Find or open the single thread between this user and a vendor. */
export async function ensureConversation(
  vendorId: string,
  vendorName?: string | null,
  bookingId?: string | null,
): Promise<string | null> {
  if (!(await hasCapability('messages'))) return null
  try {
    const supabase = requireSupabase()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return null

    const { data, error } = await supabase
      .from('conversations')
      .upsert(
        {
          user_id: auth.user.id,
          vendor_id: vendorId,
          vendor_name: vendorName ?? null,
          booking_id: bookingId ?? null,
        },
        { onConflict: 'user_id,vendor_id' },
      )
      .select('id')
      .maybeSingle()
    if (error) throw error
    return (data as { id: string } | null)?.id ?? null
  } catch (err) {
    throw toServiceError(err)
  }
}

export async function sendMessage(conversationId: string, body: string): Promise<void> {
  const text = body.trim()
  if (!text) throw new ServiceError('Write a message first.', 'validation')
  if (!(await hasCapability('messages'))) unsupported()
  try {
    const supabase = requireSupabase()
    const { error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender: 'customer', body: text })
    if (error) throw error
  } catch (err) {
    throw toServiceError(err)
  }
}

/** Clear the unread badge once the thread has actually been opened. */
export async function markThreadRead(conversationId: string): Promise<void> {
  if (!(await hasCapability('messages'))) return
  try {
    const supabase = requireSupabase()
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('sender', 'vendor')
      .is('read_at', null)
  } catch {
    /* A failed read-receipt must not break opening the thread. */
  }
}
