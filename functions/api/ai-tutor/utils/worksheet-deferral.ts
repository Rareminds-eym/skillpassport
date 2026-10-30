import type { SupabaseClient } from '@supabase/supabase-js';

/** Compare-and-swap avoids overwriting messages appended while the choice saves. */
export async function deferWorksheet(db: SupabaseClient, userId: string, conversationId: string, messageId: string) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data: conversation, error } = await db.from('tutor_conversations').select('messages,updated_at')
      .eq('id', conversationId).eq('learner_id', userId).maybeSingle();
    if (error) throw error;
    const messages = conversation?.messages as Array<{ id: string; role: string; worksheetVariants?: unknown[]; assignmentDeferred?: boolean }> | undefined;
    const source = messages?.find(m => m.id === messageId && m.role === 'assistant');
    if (!conversation || !source?.worksheetVariants?.length) return false;
    if (source.assignmentDeferred) return true;
    if (!conversation.updated_at) throw new Error('Conversation version is unavailable.');
    const timestamp = new Date(Math.max(Date.now(), Date.parse(conversation.updated_at) + 1)).toISOString();
    const { data: saved, error: saveError } = await db.from('tutor_conversations').update({
      messages: messages!.map(m => m.id === messageId ? { ...m, assignmentDeferred: true, assignmentDeferredAt: timestamp } : m),
      updated_at: timestamp,
    }).eq('id', conversationId).eq('learner_id', userId).eq('updated_at', conversation.updated_at).select('id').maybeSingle();
    if (saveError) throw saveError;
    if (saved) return true;
  }
  throw new Error('The conversation changed while saving. Please try again.');
}
