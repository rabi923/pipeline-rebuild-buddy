import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import type { User } from '@supabase/supabase-js';

// The type definition remains the same
export type ConversationDetails = {
  id: string;
  other_user_id: string;
  other_user_name: string | null;
  other_user_avatar: string | null;
  last_message_text: string | null;
  last_message_at: string | null;
  unread_count: number;
};

// *** THE CRITICAL CHANGE IS HERE ***
// The hook now accepts the user object as an argument.
export const useConversations = (user: User | null) => {
  const queryClient = useQueryClient();

  // We have REMOVED the internal useState and useEffect for fetching the user.

  const {
    data: conversations,
    isLoading,
    error,
  } = useQuery<ConversationDetails[]>({
    // The query key depends on the user's ID from the passed-in object.
    queryKey: ['conversations', user?.id],

    queryFn: async () => {
      // If the user object passed in is null, we do nothing.
      if (!user) return [];

      const { data, error } = await supabase.rpc('get_user_conversations_with_details', {
        p_user_id: user.id,
      });

      if (error) {
        console.error('Error fetching conversations:', error);
        throw new Error(error.message);
      }
      return data || [];
    },
    // The query is only enabled if the user object is not null.
    enabled: !!user,
  });

  // The real-time subscription also depends on the passed-in user object.
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['conversations', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return {
    conversations: conversations || [],
    loading: isLoading,
    error,
  };
};
