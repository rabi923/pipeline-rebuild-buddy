import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, List } from 'lucide-react';
import FoodCard from './FoodCard';
import { supabase } from '@/integrations/supabase/client';
import { useUserLocation } from '@/hooks/useUserLocation';

interface MyListingsProps {
  onBack: () => void;
}

const MyListings = ({ onBack }: MyListingsProps) => {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { location: userLocation } = useUserLocation();

  const fetchListings = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No authenticated user');
        setLoading(false);
        return;
      }

      setCurrentUserId(user.id);

      const { data, error } = await supabase
        .from('food_listings')
        .select(`
          *,
          giver:profiles!giver_id (
            id,
            full_name,
            phone,
            profile_picture_url,
            organization_name
          )
        `)
        .eq('giver_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching listings:', error);
      } else {
        setListings(data || []);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center gap-4 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">My Food Listings</h1>
            <p className="text-sm text-muted-foreground">
              {listings.length} {listings.length === 1 ? 'listing' : 'listings'}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <List className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold mb-2">No listings yet</h2>
          <p className="text-muted-foreground mb-6">
            Start sharing food with your community by creating your first listing
          </p>
          <Button onClick={onBack}>
            Go to Map
          </Button>
        </div>
      ) : (
        <ScrollArea className="h-[calc(100vh-140px)]">
          <div className="p-4 space-y-4 pb-24">
            {listings.map((listing) => (
              <FoodCard
                key={listing.id}
                listing={listing}
                isOwner={true}
                showContact={false}
                onUpdate={fetchListings}
                userLocation={userLocation}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default MyListings;
