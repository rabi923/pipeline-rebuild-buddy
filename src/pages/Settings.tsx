// src/pages/Settings.tsx

import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useAuthSession } from '@/hooks/useAuthSession'; // Correctly imported

const Settings = () => {
  const navigate = useNavigate();
  
  // This correctly provides both the loading state and the signOut function
  const { loading, signOut } = useAuthSession();

  // All the old state, useEffect, checkAuth, and handleSignOut code is now deleted.

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-4xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <h1 className="text-3xl font-bold text-primary mb-6">Settings</h1>
        
        <div className="bg-card rounded-lg p-6 shadow-[var(--shadow-card)] space-y-4">
          <h2 className="text-xl font-semibold mb-4">Account</h2>
          {/* 
            THIS IS THE KEY FIX: The onClick now calls `signOut` from our hook
            instead of the old `handleSignOut`.
          */}
          <Button variant="destructive" onClick={signOut}>
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
