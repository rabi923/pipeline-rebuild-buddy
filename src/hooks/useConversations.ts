import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

// Type definition for our SQL function's return value
export type ConversationDetails = {
  id: string;
  other_user_id: string;
  other_user_name: string | null;
  other_user_avatar: string | null;
  last_message_text: string | null;
  last_message_at: string | null;
  unread_count: number;
};

// The hook now accepts the user object, just like the last working version.
export const useConversations = (user: User | null) => {
  // We are back to using useState, which is stable in your environment.
  const [conversations, setConversations] = useState<ConversationDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  // This function will fetch the data using our efficient SQL function.
  const fetchConversations = async (currentUser: User) => {
    setLoading(true);
    try {
      const { data, error: rpcError } = await supabase.rpc('get_user_conversations_with_details', {
        p_user_id: currentUser.id,
      });

      if (rpcError) {
        throw rpcError;
      }
      setConversations(data || []);
    } catch (e) {
      setError(e);
      console.error("Failed to fetch conversations:", e);
    } finally {
      setLoading(false);
    }
  };

  // The main useEffect hook. It runs when the user object is available.
  useEffect(() => {
    // Only fetch if the user object exists.
    if (user) {
      fetchConversations(user);
    } else {
      // If there is no user, stop loading and clear conversations.
      setLoading(false);
      setConversations([]);
    }
  }, [user]); // It re-runs if the user changes.

  // The real-time subscription for new messages.
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        // When a new message comes in, simply refetch the entire list.
        () => fetchConversations(user)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]); // Re-subscribes if the user changes.

  return {
    conversations,
    loading,
    error,
  };
};
