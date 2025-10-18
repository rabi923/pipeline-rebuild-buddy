import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// A minimal shell to test the absolute core of the application
const ReceiverDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState('test_view');

  // We only fetch the user to confirm the basic Supabase connection works
  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUserEmail(data.user?.email || "No user found");
      setLoading(false);
    };
    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Starting Isolation Test...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-green-500">Isolation Test Running</h1>
        <p className="mt-2 text-lg">If you can see this, the core React app is working correctly.</p>
        <p className="mt-4 text-muted-foreground">Logged in as: <strong>{userEmail}</strong></p>
        
        <div className="mt-8 border p-4 rounded-lg">
          <p className="mb-4">Current test view: <strong>{currentTab}</strong></p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => setCurrentTab('map_view')}>Switch to Map View</Button>
            <Button onClick={() => setCurrentTab('chat_view')}>Switch to Chat View</Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            (These buttons only change text; they do not render the broken components yet)
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReceiverDashboard;
