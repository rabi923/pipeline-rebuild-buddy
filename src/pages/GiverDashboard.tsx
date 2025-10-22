import { useState } from "react";
import { useAuthSession } from '@/hooks/useAuthSession';
import MapView, { OtherUser } from "@/components/Map/MapView";
import ChatList from "@/components/Chat/ChatList";
import MyListings from "@/components/MyListings";
import BottomNavigation from "@/components/Map/BottomNavigation";
import { Loader2 } from "lucide-react";
import AddFoodDialog from "@/components/AddFoodDialog";
import ChatWindow from "@/components/Chat/ChatWindow";
import AppHeader from "@/components/AppHeader";

const GiverDashboard = () => {
  const [currentTab, setCurrentTab] = useState('map');
  const [chattingWith, setChattingWith] = useState<OtherUser | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { user, loading } = useAuthSession('food_giver');

  if (loading || !user) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  
  if (chattingWith) {
    return <ChatWindow otherUser={chattingWith} onBack={() => setChattingWith(null)} />;
  }

  const handleTabChange = (tab: string) => {
    if (tab === 'add') { setShowAddDialog(true); } else { setCurrentTab(tab); }
  };
  
  const renderContent = () => {
    switch (currentTab) {
      case 'chat': return <ChatList onBack={() => setCurrentTab('map')} />;
      case 'listings': return <MyListings onBack={() => setCurrentTab('map')} />;
      case 'map':
      default: return <MapView userRole="food_giver" onStartChat={setChattingWith} />;
    }
  };
  const canGoBack = chattingWith !== null || currentTab !== 'map';
  const handleBack = () => { if (chattingWith) { setChattingWith(null); } else if (currentTab !== 'map') { setCurrentTab('map'); } };

  return (
    <div className="h-screen w-screen flex flex-col">
      <AppHeader title="Giver Dashboard" onBack={canGoBack ? handleBack : undefined} />
      <main className="flex-grow h-full w-full">{renderContent()}</main>
      <BottomNavigation currentTab={currentTab} onTabChange={handleTabChange} userRole="food_giver" />
      <AddFoodDialog open={showAddDialog} onOpenChange={setShowAddDialog} onSuccess={() => { /* Consider adding a map refetch here */ }} />
    </div>
  );
};

export default GiverDashboard;
