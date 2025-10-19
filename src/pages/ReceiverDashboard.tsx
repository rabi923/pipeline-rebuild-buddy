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
  
  const MainContent = () => {
    switch (currentTab) {
      case 'chat': return <ChatList onBack={() => setCurrentTab('map')} />;
      case 'requests': return <MyRequests onBack={() => setCurrentTab('map')} />;
      case 'map':
      default: return <MapView userRole="food_receiver" onStartChat={setChattingWith} />;
    }
  };

  return (
    // --- THIS IS THE KEY CHANGE: THE PARENT IS NOW A "RELATIVE" CONTAINER ---
    <div className="h-screen w-screen relative">
      
      {/* --- LAYER 1: The Main Dashboard View --- */}
      {/* It is always rendered, but we change its opacity and interactivity */}
      <div
        className={`
          absolute inset-0 h-full w-full
          transition-opacity duration-300 ease-in-out
          ${chattingWith ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'}
        `}
      >
        <MainContent />
        <BottomNavigation currentTab={currentTab} onTabChange={handleTabChange} userRole="food_receiver"/>
        <AddRequestDialog open={showAddDialog} onOpenChange={setShowAddDialog} onSuccess={() => {}} />
      </div>

      {/* --- LAYER 2: The Chat Window View --- */}
      {/* This only gets added to the DOM when active, and appears on top */}
      {chattingWith && (
        <div className="absolute inset-0 h-full w-full z-10 bg-background">
          <ChatWindow otherUser={chattingWith} onBack={() => setChattingWith(null)} />
        </div>
      )}
      
    </div>
  );
};

export default ReceiverDashboard;
