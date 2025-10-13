import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import MapView from "@/components/Map/MapView";
import ChatList from "@/components/Chat/ChatList";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const GiverDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('map');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle(); // Changed from .single() to .maybeSingle()

      if (profile?.role !== 'food_giver') {
        navigate('/receiver-dashboard');
        return;
      }

      setLoading(false);
    } catch (error) {
      console.error('Auth error:', error);
      toast.error('Authentication error. Please login again.');
      navigate('/auth');
    }
  };

  // FIX: Wrap setCurrentTab in a proper function
  const handleTabChange = (tab: string) => {
    console.log('Tab changed to:', tab); // Debug log
    
    // Handle chat tab specially to prevent ChatList error
    if (tab === 'chat') {
      toast.info("Chat feature coming soon!");
      return;
    }
    
    setCurrentTab(tab);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Temporarily disable chat until it's fixed
  if (currentTab === 'chat') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Chat Coming Soon</h2>
          <p className="text-muted-foreground">We're working on the chat feature</p>
          <Button onClick={() => setCurrentTab('map')}>
            Back to Map
          </Button>
        </div>
      </div>
    );
  }

  return (
    <MapView 
      userRole="food_giver" 
      onTabChange={handleTabChange}
    />
  );
};

export default GiverDashboard;
