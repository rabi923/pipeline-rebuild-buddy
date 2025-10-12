import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useChat = (otherUserId: string | null) => {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (!otherUserId || !currentUserId) {
      setConversationId(null);
      return;
    }

    initConversation();
  }, [otherUserId, currentUserId]);

  const initConversation = async () => {
    if (!otherUserId || !currentUserId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_or_create_conversation', {
        other_user_id: otherUserId
      });

      if (error) throw error;
      setConversationId(data);
    } catch (error: any) {
      console.error('Error initializing conversation:', error);
      toast.error('Failed to start conversation');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (messageText: string) => {
    if (!conversationId || !currentUserId || !messageText.trim()) {
      return;
    }

    try {
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        message_text: messageText.trim()
      });

      if (error) throw error;

      // Update last_message_at in conversation
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      return true;
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      return false;
    }
  };

  return {
    conversationId,
    currentUserId,
    loading,
    sendMessage,
    refetch: initConversation
  };
};
