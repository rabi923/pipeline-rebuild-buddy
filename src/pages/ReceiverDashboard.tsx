import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import MapView, { OtherUser } from "@/components/Map/MapView";
import ChatList from "@/components/Chat/ChatList";
import ChatWindow from "@/components/Chat/ChatWindow";
import MyRequests from "@/components/MyRequests";
import { Loader2 } from "lucide-react";

const ReceiverDashboard = () => {
  const [currentTab, setCurrentTab] = useState('map');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [chattingWith, setChattingWith] = useState<{ otherUser: OtherUser, conversationId: string } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentUser(data.user);
      setAuthLoading(false);
    };
    fetchUser();
  }, []);

  const handleStartChat = async (otherUser: OtherUser) => {
    if (!currentUser) return;
    const { data: conversationId, error } = await supabase.rpc('get_or_create_conversation', { other_user_id: otherUser.id });
    if (error) { console.error('Could not start conversation:', error); return; }
    setChattingWith({ otherUser, conversationId });
  };

  const handleTabChange = (tab: string) => {
    setChattingWith(null);
    setCurrentTab(tab);
  };

  // --- THIS IS THE PROTECTIVE CHANGE ---
  // If we are loading or if the user is null for any reason, show the loader.
  // This prevents child components from rendering with invalid props.
  if (authLoading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // This render logic is now safe because we know currentUser is valid.
  if (chattingWith) {
    return <ChatWindow currentUser={currentUser} otherUser={chattingWith.otherUser} conversationId={chattingWith.conversationId} onBack={() => setChattingWith(null)} />;
  }

  let content;
  switch (currentTab) {
    case 'chat':
      content = <ChatList currentUser={currentUser} onBack={() => handleTabChange('map')} />;
      break;
    case 'requests':
      content = <MyRequests onBack={() => handleTabChange('map')} />;
      break;
    default:
      content = <MapView userRole="food_receiver" onStartChat={handleStartChat} />;
      break;
  }
  
  return (
    <div className="h-screen w-screen flex flex-col">
      <main className="flex-grow h-full w-full">{content}</main>
    </div>
  );
};

export default ReceiverDashboard;
