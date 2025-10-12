import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ChatList = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="h-16 border-b flex items-center px-4 gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">Messages</h1>
      </div>
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-muted-foreground">Chat feature coming soon...</p>
      </div>
    </div>
  );
};

export default ChatList;
