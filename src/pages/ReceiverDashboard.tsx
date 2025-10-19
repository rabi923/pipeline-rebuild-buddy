import { useState } from "react";
import { useAuthSession } from '@/hooks/useAuthSession';
import MapView, { OtherUser } from "@/components/Map/MapView";
import ChatList from "@/components/Chat/ChatList";
import MyRequests from "@/components/MyRequests";
import BottomNavigation from "@/components/Map/BottomNavigation";
import { Loader2 } from "lucide-react";
import AddRequestDialog from "@/components/AddRequestDialog";
import ChatWindow from "@/components/Chat/ChatWindow";

const ReceiverDashboard = () => {
  const [currentTab, setCurrentTab] = useState('map');
  const [chattingWith, setChattingWith] = useState<OtherUser | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { user, loading } = useAuthSession('food_receiver');

  if (loading || !user) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>;
  }
  
  const handleTabChange = (tab: string) => {
    if (tab === 'add') { setShowAddDialog(true); } else { setCurrentTab(tab); }
  };
  
  // This is a much cleaner way to decide which component to show.
  const MainContent = () => {
    switch (currentTab) {
      case 'chat': return <ChatList onBack={() => setCurrentTab('map')} />;
      case 'requests': return <MyRequests onBack={() => setCurrentTab('map')} />;
      case 'map':
      default: return <MapView userRole="food_receiver" onStartChat={setChattingWith} />;
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col">
      {/* --- THIS IS THE KEY CHANGE --- */}
      {/* This container holds our main views and uses CSS to show/hide them */}
      <div className="flex-grow h-full w-full">
        
        {/* The Main Content View (Map, ChatList, etc.) */}
        <div className={chattingWith ? 'hidden' : 'h-full w-full'}>
          <MainContent />
          <BottomNavigation currentTab={currentTab} onTabChange={handleTabChange} userRole="food_receiver"/>
          <AddRequestDialog open={showAddDialog} onOpenChange={setShowAddDialog} onSuccess={() => {}} />
        </div>

        {/* The Chat Window View (only visible when 'chattingWith' is active) */}
        {chattingWith && (
          <div className="h-full w-full">
            <ChatWindow otherUser={chattingWith} onBack={() => setChattingWith(null)} />
          </div>
        )}

      </div>
      {/* --- END OF KEY CHANGE --- */}
    </div>
  );
};

export default ReceiverDashboard;
