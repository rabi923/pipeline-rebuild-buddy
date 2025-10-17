import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth'; // Assuming you have a standard hook to get the current user
import { useEffect } from 'react';

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
  const { user } = useAuth(); // Get the currently authenticated user
  const queryClient = useQueryClient();

  // The main query to fetch all conversations. It's now a single RPC call.
  const {
    data: conversations,
    isLoading,
    error,
  } = useQuery<ConversationDetails[]>({
    // The query key uniquely identifies this data in the cache.
    // It includes the user's ID so it refetches if the user changes.
    queryKey: ['conversations', user?.id],

    // The query function itself:
    queryFn: async () => {
      // Don't run if there's no user.
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
      .channel('public:messages') // A unique channel name
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          // When a new message is inserted into the database,
          // invalidate our query. This tells react-query to refetch the
          // conversation list, ensuring the UI is always up-to-date
          // with the latest message, order, and unread counts.
          queryClient.invalidateQueries({ queryKey: ['conversations', user.id] });
        }
      )
      .subscribe();

    // Cleanup function: remove the channel subscription when the component unmounts.
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);


  // Return the data and loading state for the UI to use.
  return {
    conversations: conversations || [],
    loading: isLoading,
    error,
  };
};
