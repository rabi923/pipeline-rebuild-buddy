import { useState } from "react";
import { useAuthSession } from '@/hooks/useAuthSession';
import MapView, { OtherUser } from "@/components/Map/MapView";
import ChatList from "@/components/Chat/ChatList";
import ChatWindow from "@/components/Chat/ChatWindow";
import MyRequests from "@/components/MyRequests";
import BottomNavigation from "@/components/Layout/BottomNavigation";
import { Loader2 } from "lucide-react";
import AddRequestDialog from "@/components/AddRequestDialog";

const ReceiverDashboard = () => {
  const [currentTab, setCurrentTab] = useState('map');
  const [chattingWith, setChattingWith] = useState<OtherUser | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { user, profile, loading } = useAuthSession('food_receiver');

  if (loading || !user || !profile) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>;
  }
  
  if (chattingWith) {
    return <ChatWindow otherUser={chattingWith} onBack={() => setChattingWith(null)} />;
  }

  const handleTabChange = (tab: string) => {
    if (tab === 'add') setShowAddDialog(true); else setCurrentTab(tab);
  };
  
  const content = () => {
    switch (currentTab) {
      case 'chat': return <ChatList onBack={() => setCurrentTab('map')} />;
      case 'requests': return <MyRequests onBack={() => setCurrentTab('map')} />;
      case 'map':
      default: return <MapView userRole="food_receiver" onStartChat={setChattingWith} />;
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col">
      <main className="flex-grow h-full w-full">{content()}</main>
      <BottomNavigation currentTab={currentTab} onTabChange={handleTabChange} userRole="food_receiver"/>
      <AddRequestDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
    </div>
  );
};

export default ReceiverDashboard;
