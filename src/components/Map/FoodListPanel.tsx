import { ScrollArea } from '@/components/ui/scroll-area';
import FoodCard from '../FoodCard';
import { Loader2 } from 'lucide-react';
import type { LocationCoords } from '@/utils/geolocation';

interface FoodListPanelProps {
  data: any[];
  loading: boolean;
  userRole: 'food_giver' | 'food_receiver';
  userLocation: LocationCoords | null;
  currentUserId?: string;
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
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-4 text-center">
        <div>
          <p className="text-muted-foreground">
            {userRole === 'food_giver' 
              ? 'No food listings yet. Add your first listing!' 
              : 'No food available nearby. Check back later!'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4 pb-24">
        {data.map((item) => (
          <FoodCard
            key={item.id}
            listing={item}
            isOwner={userRole === 'food_giver' && item.giver_id === currentUserId}
            showContact={userRole === 'food_receiver'}
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
