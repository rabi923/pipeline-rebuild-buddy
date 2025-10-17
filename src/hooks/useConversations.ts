import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';

// This TypeScript type defines the exact shape of the data
// our new SQL function ('get_user_conversations_with_details') returns.
export type ConversationDetails = {
  id: string; // The conversation_id
  other_user_id: string;
  other_user_name: string | null;
  other_user_avatar: string | null;
  last_message_text: string | null;
  last_message_at: string | null;
  unread_count: number;
};

export const useConversations = () => {
  const queryClient = useQueryClient();
  // State to hold the current user, fetched once.
  const [user, setUser] = useState<User | null>(null);

  // Get the current user session when the hook is first used.
  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    fetchUser();
  }, []);


  // The main query to fetch all conversations.
  const {
    data: conversations,
    isLoading,
    error,
  } = useQuery<ConversationDetails[]>({
    // The query key uniquely identifies this data. It includes the user's ID
    // so it refetches if the user were to ever change.
    queryKey: ['conversations', user?.id],

    // The query function itself:
    queryFn: async () => {
      // Don't run if there's no user. This is important.
      if (!user) return [];

      // Call the database function we created in Step 1.
      const { data, error } = await supabase.rpc('get_user_conversations_with_details', {
        p_user_id: user.id, // Pass the current user's ID as the parameter
      });

      if (error) {
        console.error('Error fetching conversations:', error);
        throw new Error(error.message);
      }
      return data || [];
    },

    // This ensures the query only runs when the user object is available.
    enabled: !!user,
  });

  // This `useEffect` sets up a real-time listener for new messages.
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          // When a new message is inserted, invalidate the query.
          // This tells react-query to refetch the conversation list,
          // ensuring the UI is always up-to-date.
          queryClient.invalidateQueries({ queryKey: ['conversations', user.id] });
        }
      )
      .subscribe();

    // Cleanup function: remove the channel subscription when the component unmounts.
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return {
    // We combine the initial user loading with the conversation loading states.
    conversations: conversations || [],
    loading: isLoading || !user,
    error,
  };
};
