import { supabaseAdmin } from '../../config/supabase';
import { Conversation, Message } from '../../types';

export async function getConversations(
  userId: string,
  page: number,
  limit: number,
): Promise<Conversation[]> {
  const from = (page - 1) * limit;

  const { data, error } = await supabaseAdmin
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1);

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getMessages(
  userId: string,
  conversationId: string,
  page: number,
  limit: number,
): Promise<Message[]> {
  const { data: conversation, error: convError } = await supabaseAdmin
    .from('conversations')
    .select('id')
    .eq('id', conversationId)
    .eq('user_id', userId)
    .single();

  if (convError || !conversation) throw new Error('Conversation not found');

  const from = (page - 1) * limit;

  const { data, error } = await supabaseAdmin
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .range(from, from + limit - 1);

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function deleteConversation(userId: string, conversationId: string) {
  const { error } = await supabaseAdmin
    .from('conversations')
    .delete()
    .eq('id', conversationId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}
