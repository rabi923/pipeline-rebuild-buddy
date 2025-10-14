import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageCircle, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useConversations } from '@/hooks/useConversations';
import ChatWindow from './ChatWindow';
import { format } from 'date-fns';

const ChatList = ({ onBack }: { onBack: () => void }) => {
  const [selectedConversation, setSelectedConversation] = useState<{
    userId: string;
    userName: string;
    userAvatar?: string | null;
  } | null>(null);
  const { conversations, loading } = useConversations();

  if (selectedConversation) {
    return (
      <ChatWindow
        otherUserId={selectedConversation.userId}
        otherUserName={selectedConversation.userName}
        otherUserAvatar={selectedConversation.userAvatar}
        onBack={() => setSelectedConversation(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="h-16 border-b flex items-center px-4 gap-3 bg-card">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">Messages</h1>
      </div>

      <div className="divide-y">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && conversations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <MessageCircle className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No conversations yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Start chatting with food givers or receivers
            </p>
          </div>
        )}

        {conversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() =>
              setSelectedConversation({
                userId: conv.other_user.id,
                userName: conv.other_user.full_name || 'Unknown User',
                userAvatar: conv.other_user.profile_picture_url,
              })
            }
            className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left"
          >
            <Avatar className="h-12 w-12">
              <AvatarImage src={conv.other_user.profile_picture_url || undefined} />
              <AvatarFallback>
                {conv.other_user.full_name?.[0]?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold truncate">
                  {conv.other_user.full_name || 'Unknown User'}
                </h3>
                {conv.last_message_at && (
                  <span className="text-xs text-muted-foreground shrink-0">
                    {format(new Date(conv.last_message_at), 'MMM d')}
                  </span>
                )}
              </div>
              
              {conv.last_message && (
                <p className="text-sm text-muted-foreground truncate">
                  {conv.last_message.message_text}
                </p>
              )}
            </div>

            {conv.unread_count > 0 && (
              <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center shrink-0">
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
