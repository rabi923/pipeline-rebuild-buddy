// src/pages/GiverDashboard.tsx

import { useState } from "react";
import MapView from "@/components/Map/MapView";
import ChatList from "@/components/Chat/ChatList";
import MyListings from "@/components/MyListings";
import { Loader2 } from "lucide-react";
import { useAuthSession } from '@/hooks/useAuthSession';

const GiverDashboard = () => {
  const [currentTab, setCurrentTab] = useState('map');
  const { loading } = useAuthSession('food_giver');

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

  if (currentTab === 'listings') {
    return <MyListings onBack={() => setCurrentTab('map')} />;
  }

  return (
    <MapView 
      userRole="food_giver" 
      onTabChange={handleTabChange}
    />
  );
};

export default GiverDashboard;
