// src/pages/ReceiverDashboard.tsx

import { useState } from "react";
import MapView from "@/components/Map/MapView";
import ChatList from "@/components/Chat/ChatList";
import { Loader2 } from "lucide-react";
import { useAuthSession } from '@/hooks/useAuthSession'; // Correctly imported

const ReceiverDashboard = () => {
  const [currentTab, setCurrentTab] = useState('map');

  // This correctly protects the page for food receivers
  const { loading } = useAuthSession('food_receiver'); 

  // The old `checkAuth` function and its try/catch block are now fully deleted.

  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (currentTab === 'chat') {
    return <ChatList onBack={() => setCurrentTab('map')} />;
  }

  return (
    <MapView 
      userRole="food_receiver" 
      onTabChange={handleTabChange}
    />
  );
};

export default ReceiverDashboard;
