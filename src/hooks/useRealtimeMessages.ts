import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  message_text: string;
  read_at: string | null;
  created_at: string;
  sender?: {
    full_name: string;
    profile_picture_url: string | null;
  };
};

export const useRealtimeMessages = (conversationId: string | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentUserIdRef = useRef<string | null>(null);

  // Get current user ID once
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      currentUserIdRef.current = user?.id || null;
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    let mounted = true;

    // Fetch initial messages
    const fetchMessages = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('messages')
          .select(`
            *,
            sender:profiles!sender_id(full_name, profile_picture_url)
          `)
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (fetchError) throw fetchError;

        if (mounted) {
          setMessages(data || []);
        }
      } catch (err: any) {
        console.error('Error fetching messages:', err);
        if (mounted) {
          setError(err.message || 'Failed to load messages');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          try {
            // Fetch sender info for new message
            const { data: senderData, error: senderError } = await supabase
              .from('profiles')
              .select('full_name, profile_picture_url')
              .eq('id', payload.new.sender_id)
              .maybeSingle();

            if (senderError) {
              console.error('Error fetching sender:', senderError);
            }

            const newMessage = {
              ...payload.new,
              sender: senderData || undefined
            } as Message;

            if (mounted) {
              setMessages(prev => [...prev, newMessage]);
            }

            // Mark as read if I'm not the sender
            if (payload.new.sender_id !== currentUserIdRef.current) {
              await supabase.rpc('mark_messages_as_read', {
                p_conversation_id: conversationId
              });
            }
          } catch (err) {
            console.error('Error handling new message:', err);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          if (mounted) {
            setMessages(prev =>
              prev.map(msg =>
                msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  return { messages, loading, error };
};
