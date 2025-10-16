// src/pages/ReceiverDashboard.tsx

import { useState } from "react";
import MapView from "@/components/Map/MapView";
import ChatList from "@/components/Chat/ChatList";
import MyRequests from "@/components/MyRequests";
import { Loader2 } from "lucide-react";
import { useAuthSession } from '@/hooks/useAuthSession';

const ReceiverDashboard = () => {
  const [currentTab, setCurrentTab] = useState('map');
  const { loading } = useAuthSession('food_receiver');

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

  if (currentTab === 'requests') {
    return <MyRequests onBack={() => setCurrentTab('map')} />;
  }

  return (
    <MapView 
      userRole="food_receiver" 
      onTabChange={handleTabChange}
    />
  );
};

export default ReceiverDashboard;
