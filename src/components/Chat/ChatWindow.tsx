import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, ArrowLeft, Send } from 'lucide-react';
import { format } from 'date-fns';
import type { User } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  full_name: string;
  profile_picture_url?: string | null;
}

interface ChatWindowProps {
  currentUser: User;
  otherUser: UserProfile;
  conversationId: string;
  onBack: () => void;
}

const ChatWindow = ({ currentUser, otherUser, conversationId, onBack }: ChatWindowProps) => {
  const [newMessage, setNewMessage] = useState('');
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!conversationId,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ============================ THE FIX IS HERE ============================
  // Mark messages as read and invalidate the conversations query.
  useEffect(() => {
    // GUARD CLAUSE: We add a check to ensure currentUser is valid before proceeding.
    // This prevents the "cannot read properties of undefined" crash.
    if (!currentUser) {
      return;
    }

    supabase.rpc('mark_messages_as_read', { p_conversation_id: conversationId })
      .then(() => {
        // We can now safely access currentUser.id here.
        queryClient.invalidateQueries({ queryKey: ['conversations', currentUser.id] });
      });

  // The dependency is now on the whole currentUser object, not currentUser.id.
  // This is safer and makes our guard clause effective.
  }, [conversationId, currentUser, queryClient]);
  // ========================== END OF THE FIX ==============================

  useEffect(() => {
    const channel = supabase
      .channel(`chat-room-${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}`},
        (payload) => {
          queryClient.setQueryData(['messages', conversationId], (oldData: any) => 
            oldData ? [...oldData, payload.new] : [payload.new]
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, queryClient]);

  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      await supabase.from('messages').insert({ conversation_id: conversationId, sender_id: currentUser.id, message_text: messageText });
      await supabase.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', conversationId);
    },
    onSuccess: () => { setNewMessage(''); },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) { sendMessageMutation.mutate(newMessage.trim()); }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center p-2 border-b sticky top-0 bg-card z-10">
        <Button variant="ghost" size="icon" onClick={onBack} className="mr-2"><ArrowLeft size={24} /></Button>
        <Avatar className="h-10 w-10 mr-3"><AvatarImage src={otherUser.profile_picture_url || undefined} /><AvatarFallback>{otherUser.full_name[0]}</AvatarFallback></Avatar>
        <h2 className="font-bold text-lg">{otherUser.full_name}</h2>
      </header>

      <main className="flex-1 p-4 overflow-y-auto">
        {isLoading ? ( <div className="flex justify-center items-center h-full"><Loader2 className="h-6 w-6 animate-spin" /></div> ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex items-end gap-2 ${msg.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${ msg.sender_id === currentUser.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  <p className="break-words">{msg.message_text}</p>
                  <p className={`text-xs mt-1 text-right ${ msg.sender_id === currentUser.id ? 'text-primary-foreground/70' : 'text-muted-foreground' }`}>{format(new Date(msg.created_at), 'p')}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

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
