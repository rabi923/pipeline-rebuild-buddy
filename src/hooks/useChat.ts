import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useChat = (otherUserId: string | null) => {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        setCurrentUserId(user?.id || null);
      } catch (error) {
        console.error('Error getting current user:', error);
      }
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

      if (error) {
        console.error('RPC error:', error);
        throw error;
      }

      if (!data) {
        throw new Error('No conversation ID returned');
      }

      setConversationId(data);
    } catch (error: any) {
      console.error('Error initializing conversation:', error);
      toast.error('Failed to start conversation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (messageText: string): Promise<boolean> => {
    if (!conversationId || !currentUserId) {
      toast.error('Conversation not initialized');
      return false;
    }

    if (!messageText.trim()) {
      return false;
    }

    try {
      const { error: insertError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          message_text: messageText.trim()
        });

      if (insertError) throw insertError;

      // Update last_message_at in conversation
      const { error: updateError } = await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      if (updateError) {
        console.error('Error updating conversation timestamp:', updateError);
        // Don't throw - message was sent successfully
      }

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
