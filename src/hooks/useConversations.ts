import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type Conversation = {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message_at: string;
  created_at: string;
  other_user: {
    id: string;
    full_name: string | null;
    profile_picture_url: string | null;
  };
  last_message?: {
    message_text: string;
    sender_id: string;
  };
  unread_count: number;
};

export const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setCurrentUserId(user.id);
      await fetchConversations(user.id);
    };
    init();
  }, []);

  const fetchConversations = async (userId: string) => {
    try {
      setLoading(true);
      
      // Fetch conversations where user is participant
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order('last_message_at', { ascending: false });

      if (convError) throw convError;

      if (!convData || convData.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // Get other user profiles and last messages
      const conversationsWithDetails = await Promise.all(
        convData.map(async (conv) => {
          const otherUserId = conv.user1_id === userId ? conv.user2_id : conv.user1_id;
          
          // Fetch other user profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, full_name, profile_picture_url')
            .eq('id', otherUserId)
            .single();

          // Fetch last message
          const { data: lastMsg } = await supabase
            .from('messages')
            .select('message_text, sender_id')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Count unread messages
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .neq('sender_id', userId)
            .is('read_at', null);

          return {
            ...conv,
            other_user: profile || { id: otherUserId, full_name: 'Unknown', profile_picture_url: null },
            last_message: lastMsg,
            unread_count: count || 0,
          };
        })
      );

      setConversations(conversationsWithDetails);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUserId) return;

    // Subscribe to conversation updates
    const channel = supabase
      .channel('conversations-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `user1_id=eq.${currentUserId},user2_id=eq.${currentUserId}`,
        },
        () => {
          fetchConversations(currentUserId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  return { conversations, loading, refetch: () => currentUserId && fetchConversations(currentUserId) };
};
