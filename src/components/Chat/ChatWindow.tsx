import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useChat } from '@/hooks/useChat';
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages';
import { Loader2, ArrowLeft, Send } from 'lucide-react';
import { format } from 'date-fns';

interface ChatWindowProps {
  otherUser: { id: string, fullName: string, avatarUrl?: string | null };
  onBack: () => void;
}

const ChatWindow = ({ otherUser, onBack }: ChatWindowProps) => {
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { conversationId, currentUserId, loading: chatLoading, sendMessage } = useChat(otherUser.id);
  const { messages, loading: messagesLoading } = useRealtimeMessages(conversationId);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async () => {
    if (!messageText.trim()) return;
    const success = await sendMessage(messageText);
    if (success) { setMessageText(''); }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }};

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="h-16 border-b flex items-center px-4 gap-3 bg-card">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
        <Avatar className="h-10 w-10"><AvatarImage src={otherUser.avatarUrl || undefined} /><AvatarFallback>{otherUser.fullName[0]?.toUpperCase() || '?'}</AvatarFallback></Avatar>
        <h1 className="text-lg font-semibold">{otherUser.fullName}</h1>
      </header>
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {(chatLoading || messagesLoading) && <div className="flex items-center justify-center h-full"><Loader2 className="h-6 w-6 animate-spin" /></div>}
        {messages.map((msg) => {
          const isOwn = msg.sender_id === currentUserId;
          return (
            <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] rounded-lg px-4 py-2 ${isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <p className="text-sm break-words">{msg.message_text}</p>
                <p className={`text-xs mt-1 text-right ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{format(new Date(msg.created_at), 'p')}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </main>
      <footer className="border-t p-4 bg-card">
        <div className="flex gap-2">
          <Input value={messageText} onChange={(e) => setMessageText(e.target.value)} onKeyPress={handleKeyPress} placeholder="Type a message..." disabled={chatLoading} />
          <Button onClick={handleSend} size="icon" disabled={!messageText.trim() || chatLoading}><Send className="h-4 w-4" /></Button>
        </div>
      </footer>
    </div>
  );
};

export default ChatWindow;
