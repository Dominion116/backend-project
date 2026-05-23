import { supabaseAdmin } from '../../config/supabase';
import { predict } from '../../services/model.service';
import { Message, Conversation } from '../../types';

const CONTEXT_WINDOW = 10;

export async function sendMessage(
  userId: string,
  message: string,
  conversationId?: string,
): Promise<{ conversation: Conversation; assistantMessage: Message }> {
  let conversation: Conversation;

  if (conversationId) {
    const { data, error } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single();

    if (error || !data) throw new Error('Conversation not found');
    conversation = data;
  } else {
    const { data, error } = await supabaseAdmin
      .from('conversations')
      .insert({ user_id: userId, title: message.slice(0, 60) })
      .select()
      .single();

    if (error || !data) throw new Error('Failed to create conversation');
    conversation = data;
  }

  const { data: history } = await supabaseAdmin
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversation.id)
    .order('created_at', { ascending: false })
    .limit(CONTEXT_WINDOW);

  const contextMessages = (history ?? []).reverse() as Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;

  contextMessages.push({ role: 'user', content: message });

  const assistantContent = await predict(contextMessages);

  const { error: insertError } = await supabaseAdmin.from('messages').insert([
    { conversation_id: conversation.id, role: 'user', content: message },
    { conversation_id: conversation.id, role: 'assistant', content: assistantContent },
  ]);

  if (insertError) throw new Error('Failed to save messages');

  const { data: savedAssistant } = await supabaseAdmin
    .from('messages')
    .select('*')
    .eq('conversation_id', conversation.id)
    .eq('role', 'assistant')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return { conversation, assistantMessage: savedAssistant as Message };
}
