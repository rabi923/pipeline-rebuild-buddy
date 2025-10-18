import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// --- WE ARE RE-INTRODUCING THE REAL MAPVIEW ---
import MapView, { OtherUser } from "@/components/Map/MapView";

const ReceiverDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('map'); // Start on the map tab
  
  // This state is just a placeholder for now to satisfy the MapView's props
  const [chattingWith, setChattingWith] = useState<OtherUser | null>(null);

  // We are removing the user fetching for now to keep this test clean
  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // --- THE TEST IS HERE ---
  // We will now attempt to render the real MapView.
  return (
    <div className="h-screen w-screen">
      <MapView 
        userRole="food_receiver"
        // This is a dummy function for the test
        onStartChat={(user) => alert(`Attempting to chat with ${user.fullName}`)}
      />
    </div>
  );
};

export default ReceiverDashboard;
