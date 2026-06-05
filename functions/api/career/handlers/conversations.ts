import { createSupabaseAdminClient } from '../../../lib/supabase';
import { apiSuccess, apiError } from '../../../lib/response';

const CONVERSATIONS_PER_PAGE = 20;

export async function handleListConversations(env: any, userId: string, request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0', 10);
    const from = page * CONVERSATIONS_PER_PAGE;
    const to = from + CONVERSATIONS_PER_PAGE - 1;

    const supabase = createSupabaseAdminClient(env);
    const { data, error, count } = await supabase
      .from('career_ai_conversations')
      .select('id, title, created_at, updated_at, message_count', { count: 'exact' })
      .eq('learner_id', userId)
      .order('updated_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    return apiSuccess({
      conversations: data || [],
      total: count || 0,
      page,
      hasMore: count ? (from + CONVERSATIONS_PER_PAGE) < count : false,
    }, request);
  } catch (error) {
    console.error('[ERROR] conversations list:', error);
    return apiError(500, 'INTERNAL_ERROR', 'Failed to fetch conversations', request);
  }
}

export async function handleGetConversation(env: any, userId: string, request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id') || '';
    if (!id) return apiError(400, 'BAD_REQUEST', 'Conversation ID required', request);

    const supabase = createSupabaseAdminClient(env);
    const { data, error } = await supabase
      .from('career_ai_conversations')
      .select('*')
      .eq('id', id)
      .eq('learner_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return apiError(404, 'NOT_FOUND', 'Conversation not found', request);
      throw error;
    }

    return apiSuccess(data, request);
  } catch (error) {
    console.error('[ERROR] conversation get:', error);
    return apiError(500, 'INTERNAL_ERROR', 'Failed to fetch conversation', request);
  }
}

export async function handleDeleteConversation(env: any, userId: string, request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id') || '';

    const supabase = createSupabaseAdminClient(env);
    const { error } = await supabase
      .from('career_ai_conversations')
      .delete()
      .eq('id', id)
      .eq('learner_id', userId);

    if (error) throw error;
    return apiSuccess({ deleted: true }, request);
  } catch (error) {
    console.error('[ERROR] conversation delete:', error);
    return apiError(500, 'INTERNAL_ERROR', 'Failed to delete conversation', request);
  }
}
