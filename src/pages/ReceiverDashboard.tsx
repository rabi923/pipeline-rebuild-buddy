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
  
  // A helper function to decide which of the MAIN tabs to show.
  // This does not include the one-on-one ChatWindow.
  const MainContent = () => {
    switch (currentTab) {
      case 'chat': return <ChatList onBack={() => setCurrentTab('map')} />;
      case 'requests': return <MyRequests onBack={() => setCurrentTab('map')} />;
      case 'map':
      default: return <MapView userRole="food_receiver" onStartChat={setChattingWith} />;
    }
  };

  return (
    // This container is the key. It's a "relative" positioning context.
    <div className="h-screen w-screen relative">
      
      {/* ======================= THE KEY CHANGE IS HERE ======================== */}
      
      {/* --- LAYER 1: The Main Dashboard View --- */}
      {/* This layer is now always rendered. It contains the MapView. */}
      {/* We use CSS 'visibility' and 'opacity' to hide it without destroying it. */}
      <div
        style={{
          visibility: chattingWith ? 'hidden' : 'visible',
          opacity: chattingWith ? 0 : 1,
        }}
        className="h-full w-full absolute inset-0 transition-opacity duration-300"
      >
        <MainContent />
        <BottomNavigation currentTab={currentTab} onTabChange={handleTabChange} userRole="food_receiver"/>
        <AddRequestDialog open={showAddDialog} onOpenChange={setShowAddDialog} onSuccess={() => {}} />
      </div>

      {/* --- LAYER 2: The Chat Window View --- */}
      {/* This layer is only rendered when `chattingWith` is active. */}
      {/* It appears on top of the hidden, but still existing, MapView. */}
      {chattingWith && (
        <div className="absolute inset-0 h-full w-full z-10 bg-background">
          <ChatWindow otherUser={chattingWith} onBack={() => setChattingWith(null)} />
        </div>
      )}
      
      {/* ======================= END OF THE KEY CHANGE ======================== */}
    </div>
  );
};

export default ReceiverDashboard;
