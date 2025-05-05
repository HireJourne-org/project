import { supabase } from './supabaseService';

export interface Message {
  id: string;
  user_id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  created_at?: string;
}

export const fetchChatHistory = async (): Promise<Message[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('No authenticated user');
  }

  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching chat history:', error);
    throw error;
  }

  return data || [];
};

export const saveMessage = async (message: Omit<Message, 'id' | 'user_id' | 'created_at'>): Promise<Message> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('No authenticated user');
  }

  const { data, error } = await supabase
    .from('chat_messages')
    .insert([{ ...message, user_id: user.id }])
    .select()
    .single();

  if (error) {
    console.error('Error saving message:', error);
    throw error;
  }

  return data;
};

export const clearChatHistory = async (): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('No authenticated user');
  }

  const { error } = await supabase
    .from('chat_messages')
    .delete()
    .eq('user_id', user.id);

  if (error) {
    console.error('Error clearing chat history:', error);
    throw error;
  }
};