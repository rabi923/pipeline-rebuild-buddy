import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import MapView, { OtherUser } from "@/components/Map/MapView";
import ChatList from "@/components/Chat/ChatList";
import ChatWindow from "@/components/Chat/ChatWindow";
import MyRequests from "@/components/MyRequests";
import { Loader2 } from "lucide-react";
// You will likely have a BottomNavigation component, this code assumes it exists
// import BottomNavigation from "@/components/Layout/BottomNavigation"; 

const ReceiverDashboard = () => {
  const [currentTab, setCurrentTab] = useState('map');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // This state is crucial: it holds the info needed to open a specific chat window
  const [chattingWith, setChattingWith] = useState<{ otherUser: OtherUser, conversationId: string } | null>(null);

  // Fetch the current user ONCE when the dashboard loads
  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentUser(data.user);
      setAuthLoading(false);
    };
    fetchUser();
  }, []);
  
  // This function is passed to MapView. It's called when 'Message Giver' is clicked.
  const handleStartChat = async (otherUser: OtherUser) => {
    // We must have the current user to create or find a conversation
    if (!currentUser) return;
    
    // Call the Supabase function you already have to get or create a conversation
    const { data: conversationId, error } = await supabase.rpc('get_or_create_conversation', {
      other_user_id: otherUser.id,
    });
    
    if (error) {
      console.error('Could not start conversation:', error);
      return;
    }
    
    // Set the specific user and conversation we want to chat with
    setChattingWith({ otherUser, conversationId });
  };
  
  const handleTabChange = (tab: string) => {
    // When changing tabs, make sure we are not in a direct message window
    setChattingWith(null); 
    setCurrentTab(tab);
  };

  // --- Render Logic ---
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // If `chattingWith` is set, we show the ChatWindow, overriding any other view.
  if (chattingWith && currentUser) {
    return (
      <ChatWindow 
        currentUser={currentUser}
        otherUser={chattingWith.otherUser}
        conversationId={chattingWith.conversationId}
        onBack={() => setChattingWith(null)} // The back button clears this state
      />
    );
  }

  // Use a switch for cleaner view rendering based on the currentTab state
  let content;
  switch (currentTab) {
    case 'chat':
      content = <ChatList onBack={() => handleTabChange('map')} />;
      break;
    case 'requests':
      content = <MyRequests onBack={() => handleTabChange('map')} />;
      break;
    case 'map':
    default:
      content = (
        <MapView 
          userRole="food_receiver" 
          onStartChat={handleStartChat} // Pass the handler function as a prop
        />
      );
      break;
  }
  
  return (
    <div className="h-screen w-screen flex flex-col">
        {/* Main content area takes all available space */}
        <main className="flex-grow h-full w-full">
          {content}
        </main>
        
        {/* Your BottomNavigation would go here and use handleTabChange */}
        {/* Example: <BottomNavigation currentTab={currentTab} onTabChange={handleTabChange} /> */}
    </div>
  );
};

export default ReceiverDashboard;
