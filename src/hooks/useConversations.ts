import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export type ConversationDetails = {
  id: string; other_user_id: string; other_user_name: string | null;
  other_user_avatar: string | null; last_message_text: string | null;
  last_message_at: string | null; unread_count: number;
};

// This hook now follows the stable useState/useEffect pattern.
export const useConversations = () => {
  const [conversations, setConversations] = useState<ConversationDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUserAndConversations = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (!user) {
        setLoading(false);
        setConversations([]);
        return;
      }
      
      const { data, error } = await supabase.rpc('get_user_conversations_with_details', {
        p_user_id: user.id,
      });

      if (error) {
        console.error("Failed to fetch conversations:", error);
      } else {
        setConversations(data || []);
      }
      setLoading(false);
    };
    fetchUserAndConversations();

    const channel = supabase.channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' },
        () => fetchUserAndConversations()
      ).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { conversations, loading, user };
};
