// src/pages/GiverDashboard.tsx

import { useState } from "react"; // useNavigate and supabase are no longer needed here
import MapView from "@/components/Map/MapView";
import ChatList from "@/components/Chat/ChatList";
import { Loader2 } from "lucide-react";
import { useAuthSession } from '@/hooks/useAuthSession'; // Correctly imported

const GiverDashboard = () => {
  // `navigate` is no longer needed because the hook handles navigation
  const [currentTab, setCurrentTab] = useState('map');
  
  // This one line correctly handles all authentication and role-checking
  const { loading } = useAuthSession('food_giver'); 

  // The entire old `checkAuth` function and its `try/catch` block are now deleted.

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
      userRole="food_giver" 
      onTabChange={handleTabChange}
    />
  );
};

export default GiverDashboard;
