import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, ArrowLeft, Send } from 'lucide-react';
import { format } from 'date-fns';
import type { User } from '@supabase/supabase-js';

// Define the shape of the user profile objects passed as props
// We use a simplified version of the full User object
interface UserProfile {
  id: string;
  full_name: string;
  profile_picture_url?: string | null;
}

interface ChatWindowProps {
  currentUser: User; // The full user object for the person using the app
  otherUser: UserProfile; // The profile of the person they are chatting with
  conversationId: string; // The ID of the conversation
  onBack: () => void; // Function to go back to the ChatList
}

const ChatWindow = ({ currentUser, otherUser, conversationId, onBack }: ChatWindowProps) => {
  const [newMessage, setNewMessage] = useState('');
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  // --- 1. DATA FETCHING ---
  // Fetch all messages for this conversation using useQuery.
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!conversationId, // Only run if conversationId exists
  });

  // --- 2. SIDE EFFECTS (useEffect hooks) ---

  // Auto-scroll to the newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Mark messages as read whenever this component is open
  useEffect(() => {
    // This calls the `mark_messages_as_read` function in your database
    supabase.rpc('mark_messages_as_read', { p_conversation_id: conversationId })
      .then(() => {
        // After marking as read, invalidate the conversations query to update the unread count in ChatList
        queryClient.invalidateQueries({ queryKey: ['conversations', currentUser.id] });
      });
  }, [conversationId, currentUser.id, queryClient]);

  // Real-time subscription to new messages
  useEffect(() => {
    const channel = supabase
      .channel(`chat-room-${conversationId}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages', 
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          // When a new message arrives, add it to the query cache directly
          // This is more efficient than refetching the whole list
          queryClient.setQueryData(['messages', conversationId], (oldData: any) => 
            oldData ? [...oldData, payload.new] : [payload.new]
          );
        }
      )
      .subscribe();

    // Clean up the subscription when the component unmounts
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  // --- 3. MUTATION (for sending messages) ---
  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      // First, insert the new message into the 'messages' table
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: currentUser.id,
        message_text: messageText,
      });

      if (error) throw error;
      
      // Then, update the 'last_message_at' on the conversation itself
      // This is CRITICAL for keeping the ChatList sorted correctly.
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);
    },
    onSuccess: () => {
        setNewMessage(''); // Clear the input box
        // No need to invalidate the 'messages' query because our real-time subscription handles that.
    },
    onError: (err) => {
      console.error("Error sending message:", err);
      // Optionally show a toast notification to the user here
    }
  });

  // --- 4. RENDER LOGIC ---
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      sendMessageMutation.mutate(newMessage.trim());
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header Bar */}
      <header className="flex items-center p-2 border-b sticky top-0 bg-card z-10">
        <Button variant="ghost" size="icon" onClick={onBack} className="mr-2">
          <ArrowLeft size={24} />
        </Button>
        <Avatar className="h-10 w-10 mr-3">
          <AvatarImage src={otherUser.profile_picture_url || undefined} />
          <AvatarFallback>{otherUser.full_name[0]}</AvatarFallback>
        </Avatar>
        <h2 className="font-bold text-lg">{otherUser.full_name}</h2>
      </header>

      {/* Message Display Area */}
      <main className="flex-1 p-4 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-full"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex items-end gap-2 ${msg.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                {/* Your messages are on the right, theirs are on the left */}
                <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${
                    msg.sender_id === currentUser.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}>
                  <p className="break-words">{msg.message_text}</p>
                  <p className={`text-xs mt-1 text-right ${ msg.sender_id === currentUser.id ? 'text-primary-foreground/70' : 'text-muted-foreground' }`}>
                    {format(new Date(msg.created_at), 'p')}
                  </p>
                </div>
              </div>
            ))}
            {/* This empty div is the target for our auto-scroll */}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Message Input Form */}
      <footer className="p-4 border-t bg-card">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." disabled={sendMessageMutation.isPending} autoComplete="off" />
          <Button type="submit" disabled={sendMessageMutation.isPending || !newMessage.trim()}>
            {sendMessageMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send size={20} />}
          </Button>
        </form>
      </footer>
    </div>
  );
};

export default ChatWindow;
