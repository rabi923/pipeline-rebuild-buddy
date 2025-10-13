import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import MapView from "@/components/Map/MapView";
import ChatList from "@/components/Chat/ChatList";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button"; // Added Button import for the coming soon section

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
        .maybeSingle();

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

  const handleTabChange = (tab: string) => {
    console.log('Tab changed to:', tab);
    
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

  // --- MODIFICATION FOR DEBUGGING ---
  // The original <MapView> component has been commented out to test if the error is inside it.
  /*
  return (
    <MapView 
      userRole="food_giver" 
      onTabChange={handleTabChange}
    />
  );
  */

  // We now return this simple div instead. If you can see this text in your app,
  // it confirms the error is caused by something inside the MapView component.
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Giver Dashboard Loaded Successfully</h1>
      <p className="text-lg text-gray-600">
        This page is visible because the `MapView` component is not being rendered.
      </p>
      <p className="text-md text-gray-500 mt-2">
        This test proves the error originates from within `MapView.tsx` or one of its dependencies.
      </p>
      <p className="text-md text-gray-500 mt-4 font-semibold">
        Next step: You can now undo this change and begin debugging `MapView.tsx`.
      </p>
    </div>
  );
  // --- END OF MODIFICATION ---
};

export default GiverDashboard;
