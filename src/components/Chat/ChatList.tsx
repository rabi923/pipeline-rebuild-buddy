import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageCircle, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useConversations } from '@/hooks/useConversations';
import ChatWindow from './ChatWindow';
import { format, isToday, isYesterday } from 'date-fns';

const formatTimestamp = (date: Date) => {
  if (isToday(date)) { return format(date, 'p'); }
  if (isYesterday(date)) { return 'Yesterday'; }
  return format(date, 'MMM d');
};

const ChatList = ({ onBack }: { onBack: () => void }) => {
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const { conversations, loading } = useConversations();

  if (selectedUser) {
    return (
      <ChatWindow
        otherUser={{ id: selectedUser.id, fullName: selectedUser.name, avatarUrl: selectedUser.avatar }}
        onBack={() => setSelectedUser(null)}
      />
    );
  }
  return (
    <div className="min-h-screen bg-background">
      <header className="h-16 border-b flex items-center px-4 gap-3 bg-card sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
        <h1 className="text-xl font-bold">Messages</h1>
      </header>
      <div className="divide-y">
        {loading && <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin"/></div>}
        {!loading && conversations.map((conv) => (
          <button key={conv.id}
            onClick={() => setSelectedUser({ id: conv.other_user_id, name: conv.other_user_name, avatar: conv.other_user_avatar })}
            className="w-full flex items-center gap-3 p-4 hover:bg-muted/50">
            <Avatar className="h-12 w-12">
              <AvatarImage src={conv.other_user_avatar || undefined} />
              <AvatarFallback>{conv.other_user_name?.[0]?.toUpperCase() || '?'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold truncate">{conv.other_user_name}</h3>
                {conv.last_message_at && <span className="text-xs text-muted-foreground shrink-0">{formatTimestamp(new Date(conv.last_message_at))}</span>}
              </div>
              <p className="text-sm text-muted-foreground truncate">{conv.last_message_text}</p>
            </div>
            {conv.unread_count > 0 && <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">{conv.unread_count}</div>}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChatList;
