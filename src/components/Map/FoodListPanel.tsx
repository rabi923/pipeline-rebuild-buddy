import { ScrollArea } from '@/components/ui/scroll-area';
import FoodCard from '../FoodCard';
import { Loader2, PackageX } from 'lucide-react';
import type { LocationCoords } from '@/utils/geolocation';

interface FoodListPanelProps {
  data: any[];
  loading: boolean;
  userRole: 'food_giver' | 'food_receiver';
  userLocation: LocationCoords | null;
  currentUserId?: string | null;
  onUpdate?: () => void;
  onMessageClick?: (giverId: string) => void;
}

const FoodListPanel = ({ 
  data, 
  loading, 
  userRole, 
  userLocation,
  currentUserId,
  onUpdate,
  onMessageClick 
}: FoodListPanelProps) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading food listings...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <PackageX className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-2">
          {userRole === 'food_giver' ? 'No Listings Yet' : 'No Food Available'}
        </h3>
        <p className="text-muted-foreground text-sm max-w-xs">
          {userRole === 'food_giver' 
            ? 'Start sharing food with your community. Click the + button to add your first listing!' 
            : 'No food donations available in your area right now. Check back later or expand your search area!'}
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-3 pb-24">
        <div className="mb-2">
          <h2 className="text-lg font-semibold">
            {userRole === 'food_giver' ? 'Your Listings' : 'Available Food'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {data.length} {data.length === 1 ? 'item' : 'items'} found
          </p>
        </div>
        
        {data.map((item) => (
          <FoodCard
            key={item.id}
            listing={item}
            isOwner={userRole === 'food_giver' && item.giver_id === currentUserId}
            showContact={userRole === 'food_receiver' && item.giver_id !== currentUserId}
            onUpdate={onUpdate}
            userLocation={userLocation}
            onMessageClick={onMessageClick}
          />
        ))}
      </div>
    </ScrollArea>
  );
};

export default FoodListPanel;
