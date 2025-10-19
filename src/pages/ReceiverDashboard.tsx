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
  
  // The simple, reliable logic. If chattingWith is active, ONLY render ChatWindow.
  if (chattingWith) {
    return <ChatWindow otherUser={chattingWith} onBack={() => setChattingWith(null)} />;
  }

  const handleTabChange = (tab: string) => {
    if (tab === 'add') { setShowAddDialog(true); } else { setCurrentTab(tab); }
  };
  
  const renderContent = () => {
    switch (currentTab) {
      case 'chat': return <ChatList onBack={() => setCurrentTab('map')} />;
      case 'requests': return <MyRequests onBack={() => setCurrentTab('map')} />;
      case 'map':
      default: return <MapView userRole="food_receiver" onStartChat={setChattingWith} />;
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col">
      <main className="flex-grow h-full w-full">{renderContent()}</main>
      <BottomNavigation currentTab={currentTab} onTabChange={handleTabChange} userRole="food_receiver"/>
      <AddRequestDialog open={showAddDialog} onOpenChange={setShowAddDialog} onSuccess={() => {}} />
    </div>
  );
};

export default ReceiverDashboard;
