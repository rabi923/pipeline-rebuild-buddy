import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import MapView from "@/components/Map/MapView";
import ChatList from "@/components/Chat/ChatList";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

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
      <div className="m
