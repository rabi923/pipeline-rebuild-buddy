// src/hooks/useAuthSession.ts
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { Session, User } from '@supabase/supabase-js';
import { toast } from 'sonner';

// Define the shape of your user profile
interface Profile {
  id: string;
  role: 'food_giver' | 'food_receiver';
  full_name: string;
  location?: string;
  // Add other fields like full_name if you need them
}

export const useAuthSession = (expectedRole?: 'food_giver' | 'food_receiver') => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        toast.error('Could not verify authentication');
        navigate('/auth', { replace: true });
        return;
      }
      
      if (!currentSession) {
        navigate('/auth', { replace: true });
        return;
      }

      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentSession.user.id)
        .single();
      
      if (profileError || !userProfile) {
        toast.error('Your profile could not be loaded. Please sign in again.');
        await supabase.auth.signOut(); // Clean up bad state
        navigate('/auth', { replace: true });
        return;
      }

      // If an expected role is provided, check against it
      if (expectedRole && userProfile.role !== expectedRole) {
        // Redirect to the correct dashboard based on actual role
        const redirectTo = userProfile.role === 'food_giver' ? '/giver-dashboard' : '/receiver-dashboard';
        navigate(redirectTo, { replace: true });
        return;
      }

      // All checks passed
      setSession(currentSession);
      setUser(currentSession.user);
      setProfile(userProfile);
      setLoading(false);
    };

    checkSession();
  }, [navigate, expectedRole]);
  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success('Signed out successfully');
    navigate('/', { replace: true });
  };

  return { session, user, profile, loading, signOut   };
};
