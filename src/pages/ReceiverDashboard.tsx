import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import MapView from "@/components/Map/MapView";
import ChatList from "@/components/Chat/ChatList";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const ReceiverDashboard = () => {
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
        navigate('/auth', { replace: true });
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        toast.error('Failed to load profile. Please login again.');
        await supabase.auth.signOut();
        navigate('/auth', { replace: true });
        return;
      }

      // Profile doesn't exist
      if (!profile) {
        toast.error('Profile not found. Please sign up again.');
        await supabase.auth.signOut();
        navigate('/auth', { replace: true });
        return;
      }

      // Profile exists but wrong role
      if (profile.role === 'food_giver') {
        navigate('/giver-dashboard', { replace: true });
        return;
      }

      // Profile exists but role is neither giver nor receiver
      if (profile.role !== 'food_receiver') {
        toast.error('Invalid user role. Please contact support.');
        await supabase.auth.signOut();
        navigate('/auth', { replace: true });
        return;
      }

      // All good - user is a food receiver
      setLoading(false);

    } catch (error) {
      console.error('Auth error:', error);
      toast.error('Authentication error. Please login again.');
      navigate('/auth', { replace: true });
    }
  };

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
