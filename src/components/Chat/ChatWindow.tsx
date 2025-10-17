import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, ArrowLeft, Send } from 'lucide-react';
import { format } from 'date-fns';
import type { User } from '@supabase/supabase-js';

// Define the shape of the user profile objects passed as props
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
  // We now use useState instead of useQuery and useMutation
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  // Fetch initial messages using useEffect
  useEffect(() => {
    if (!conversationId) return;

    const fetchMessages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error("Error fetching messages:", error);
      } else {
        setMessages(data || []);
      }
      setLoading(false);
    };

    fetchMessages();
  }, [conversationId]);

  // Auto-scroll to the newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Real-time subscription to new messages
  useEffect(() => {
    const channel = supabase
      .channel(`chat-room-${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}`},
        (payload) => {
          setMessages((currentMessages) => [...currentMessages, payload.new]);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversationId]);

  // Simple async function to handle sending messages
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    const textToSend = newMessage.trim();
    setNewMessage('');

    // Insert the new message
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: currentUser.id,
      message_text: textToSend,
    });
    
    // Update the conversation's timestamp for sorting
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

    setIsSending(false);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center p-2 border-b sticky top-0 bg-card z-10">
        <Button variant="ghost" size="icon" onClick={onBack} className="mr-2"><ArrowLeft size={24} /></Button>
        <Avatar className="h-10 w-10 mr-3"><AvatarImage src={otherUser.profile_picture_url || undefined} /><AvatarFallback>{otherUser.full_name?.[0]}</AvatarFallback></Avatar>
        <h2 className="font-bold text-lg">{otherUser.full_name}</h2>
      </header>

      <main className="flex-1 p-4 overflow-y-auto">
        {loading ? ( <div className="flex justify-center items-center h-full"><Loader2 className="h-6 w-6 animate-spin" /></div> ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex items-end gap-2 ${msg.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${ msg.sender_id === currentUser.id ? 'bg-primary text-primary-foregrou
