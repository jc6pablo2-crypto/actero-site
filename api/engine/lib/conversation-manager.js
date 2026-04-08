/**
 * Actero Engine — Conversation Manager
 * Manages multi-turn conversation threads.
 */

/**
 * Find an existing active thread or create a new one.
 */
export async function findOrCreateThread(supabase, { clientId, customerEmail, externalTicketId, source }) {
  // Try to find existing active thread
  let query = supabase
    .from('engine_conversation_threads')
    .select('*')
    .eq('client_id', clientId)
    .eq('status', 'active')

  if (externalTicketId) {
    query = query.eq('external_ticket_id', externalTicketId)
  } else if (customerEmail) {
    query = query.eq('customer_email', customerEmail).is('external_ticket_id', null)
  }

  const { data: existing } = await query.order('last_message_at', { ascending: false }).limit(1).maybeSingle()

  if (existing) {
    return existing
  }

  // Create new thread
  const { data: created, error } = await supabase
    .from('engine_conversation_threads')
    .insert({
      client_id: clientId,
      customer_email: customerEmail,
      external_ticket_id: externalTicketId,
      source,
      messages: [],
      status: 'active',
      message_count: 0,
      last_message_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to create thread: ${error.message}`)
  return created
}

/**
 * Append a message to a thread and return updated history.
 */
export async function appendMessage(supabase, threadId, role, content) {
  const { data: thread } = await supabase
    .from('engine_conversation_threads')
    .select('messages, message_count')
    .eq('id', threadId)
    .single()

  if (!thread) throw new Error(`Thread ${threadId} not found`)

  const messages = [...(thread.messages || []), {
    role,
    content,
    timestamp: new Date().toISOString(),
  }]

  await supabase
    .from('engine_conversation_threads')
    .update({
      messages,
      message_count: (thread.message_count || 0) + 1,
      last_message_at: new Date().toISOString(),
    })
    .eq('id', threadId)

  return messages
}

/**
 * Get conversation history from a thread (for Claude context).
 */
export function getConversationHistory(thread, limit = 10) {
  if (!thread?.messages) return []
  return thread.messages.slice(-limit)
}

/**
 * Mark a thread as resolved.
 */
export async function resolveThread(supabase, threadId) {
  await supabase
    .from('engine_conversation_threads')
    .update({ status: 'resolved' })
    .eq('id', threadId)
}

/**
 * Mark a thread as escalated.
 */
export async function escalateThread(supabase, threadId) {
  await supabase
    .from('engine_conversation_threads')
    .update({ status: 'escalated' })
    .eq('id', threadId)
}
