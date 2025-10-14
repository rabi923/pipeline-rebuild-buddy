import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, AlertCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useChat } from '@/hooks/useChat';
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ChatWindowProps {
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar?: string | null;
  onBack: () => void;
}

const ChatWindow = ({ otherUserId, otherUserName, otherUserAvatar, onBack }: ChatWindowProps) => {
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { conversationId, currentUserId, loading: chatLoading, sendMessage } = useChat(otherUserId);
  const { messages, loading: messagesLoading } = useRealtimeMessages(conversationId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-focus input when chat loads
  useEffect(() => {
    if (!chatLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [chatLoading]);

  const handleSend = async () => {
    if (!messageText.trim() || sending) return;
    
    setSending(true);
    try {
      const success = await sendMessage(messageText.trim());
      if (success) {
        setMessageText('');
        inputRef.current?.focus();
      } else {
        toast.error('Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="h-16 border-b flex items-center px-4 gap-3 bg-card shadow-sm">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Avatar className="h-10 w-10">
          <AvatarImage src={otherUserAvatar || undefined} alt={otherUserName} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {otherUserName[0]?.toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-lg font-semibold">{otherUserName}</h1>
          {conversationId && (
            <p className="text-xs text-muted-foreground">
              {messages.length} message{messages.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10">
        {(chatLoading || messagesLoading) && (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading conversation...</p>
          </div>
        )}
        
        {!chatLoading && !messagesLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Send className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="font-medium text-lg mb-1">No messages yet</p>
              <p className="text-muted-foreground text-sm">
                Start the conversation with {otherUserName}
              </p>
            </div>
          </div>
        )}

        {!chatLoading && !messagesLoading && messages.map((msg) => {
          const isOwn = msg.sender_id === currentUserId;
          return (
            <div
              key={msg.id}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm ${
                  isOwn
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-card border rounded-bl-sm'
                }`}
              >
                <p className="text-sm break-words whitespace-pre-wrap">{msg.message_text}</p>
                <p className={`text-xs mt-1.5 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {format(new Date(msg.created_at), 'h:mm a')}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4 bg-card">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1"
            disabled={chatLoading || sending}
            maxLength={1000}
          />
          <Button 
            onClick={handleSend} 
            size="icon"
            disabled={!messageText.trim() || chatLoading || sending}
            className="shrink-0"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        {messageText.length > 900 && (
          <p className="text-xs text-muted-foreground mt-1">
            {1000 - messageText.length} characters remaining
          </p>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;
