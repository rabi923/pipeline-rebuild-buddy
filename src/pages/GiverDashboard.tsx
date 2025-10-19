import { useState } from "react";
import { useAuthSession } from '@/hooks/useAuthSession';
import MapView, { OtherUser } from "@/components/Map/MapView";
import ChatList from "@/components/Chat/ChatList";
import MyListings from "@/components/MyListings";
import BottomNavigation from "@/components/Map/BottomNavigation"; // Correct path to your BottomNav
import { Loader2 } from "lucide-react";
import AddFoodDialog from "@/components/AddFoodDialog"; // Givers use the AddFoodDialog
import ChatWindow from "@/components/Chat/ChatWindow"; // Import the ChatWindow

const GiverDashboard = () => {
  const [currentTab, setCurrentTab] = useState('map');
  const [chattingWith, setChattingWith] = useState<OtherUser | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Get the user object from the session hook
  const { user, loading } = useAuthSession('food_giver');

  // Show a loader while the user session is being verified
  if (loading || !user) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // If we are actively chatting, render only the ChatWindow
  if (chattingWith) {
    return <ChatWindow otherUser={chattingWith} onBack={() => setChattingWith(null)} />;
  }

  // Handle tab changes from the bottom navigation
  const handleTabChange = (tab: string) => {
    // The "add" button in the nav opens the dialog
    if (tab === 'add') {
      setShowAddDialog(true);
    } else {
      setCurrentTab(tab);
    }
  };
  
  // A helper function to decide which main component to show
  const renderContent = () => {
    switch (currentTab) {
      case 'chat':
        return <ChatList onBack={() => setCurrentTab('map')} />;
      case 'listings':
        return <MyListings onBack={() => setCurrentTab('map')} />;
      case 'map':
      default:
        // Pass the onStartChat handler to the map
        return <MapView userRole="food_giver" onStartChat={setChattingWith} />;
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col">
      <main className="flex-grow h-full w-full">{renderContent()}</main>
      
      {/* Your navigation and dialogs */}
      <BottomNavigation
        currentTab={currentTab}
        onTabChange={handleTabChange}
        userRole="food_giver"
      />
      <AddFoodDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={() => { /* You might want to refetch map data here */ }}
      />
    </div>
  );
};

export default GiverDashboard;
