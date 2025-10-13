import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ChatList from "@/components/Chat/ChatList";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const GiverDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('map');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile?.role !== 'food_giver') {
      navigate('/receiver-dashboard');
      return;
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (currentTab === 'chat') {
    return <ChatList />;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <h1 className="text-2xl font-bold mb-4">Food Giver Dashboard</h1>
      <p className="text-muted-foreground mb-4">Map view temporarily disabled - fixing react-leaflet issue</p>
      <Button onClick={() => setCurrentTab('chat')}>Go to Chat</Button>
    </div>
  );
};

export default GiverDashboard;
