import { useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageCircle, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useConversations, ConversationDetails } from '@/hooks/useConversations';
import ChatWindow from './ChatWindow';
import { format, isToday, isYesterday } from 'date-fns';

const formatTimestamp = (date: Date) => {
  if (isToday(date)) return format(date, 'p');
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d');
};

interface ChatListProps {
  currentUser: User;
  onBack: () => void;
}

const ChatList = ({ currentUser, onBack }: ChatListProps) => {
  const [selectedConversation, setSelectedConversation] = useState<ConversationDetails | null>(null);

  // *** THE CRITICAL CHANGE IS HERE ***
  // We now pass the currentUser prop into our hook.
  const { conversations, loading } = useConversations(currentUser);

  // We have REMOVED the useEffect that fetched the user from this component.

  if (selectedConversation) {
    return (
      <ChatWindow
        conversationId={selectedConversation.id}
        currentUser={currentUser}
        otherUser={{
          id: selectedConversation.other_user_id,
          full_name: selectedConversation.other_user_name || 'Unknown User',
          profile_picture_url: selectedConversation.other_user_avatar,
        }}
        onBack={() => setSelectedConversation(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="h-16 border-b flex items-center px-4 gap-3 bg-card sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">Messages</h1>
      </header>
      <div className="divide-y">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {!loading && conversations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <MessageCircle className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No conversations yet.</p>
          </div>
        )}
        {conversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => setSelectedConversation(conv)}
            className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left"
          >
            <Avatar className="h-12 w-12">
              <AvatarImage src={conv.other_user_avatar || undefined} />
              <AvatarFallback>
                {conv.other_user_name?.[0]?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold truncate">
                  {conv.other_user_name || 'Unknown User'}
                </h3>
                {conv.last_message_at && (
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatTimestamp(new Date(conv.last_message_at))}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {conv.last_message_text || 'No messages yet.'}
              </p>
            </div>
            {conv.unread_count > 0 && (
              <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center shrink-0 font-bold">
                {conv.unread_count}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChatList;
