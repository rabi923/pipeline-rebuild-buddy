// src/pages/Profile.tsx

import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useAuthSession } from '@/hooks/useAuthSession'; // Correctly imported

const Profile = () => {
  const navigate = useNavigate();

  // This one line correctly replaces all the old state and useEffect hooks
  const { profile, loading } = useAuthSession();

  // All of the old `fetchProfile` function is now deleted.

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
        
        <h1 className="text-3xl font-bold text-primary mb-6">Profile</h1>
        
        {/* This part was already correct and works perfectly with the new hook */}
        {profile && (
          <div className="bg-card rounded-lg p-6 shadow-[var(--shadow-card)]">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="text-lg font-medium">{profile.full_name || 'Not set'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Role</p>
                <p className="text-lg font-medium capitalize">{profile.role?.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="text-lg font-medium">{profile.location || 'Not set'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
