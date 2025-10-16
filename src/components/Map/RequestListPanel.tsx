import { ScrollArea } from '@/components/ui/scroll-area';
import RequestCard from '../RequestCard';
import { Loader2 } from 'lucide-react';
import type { LocationCoords } from '@/utils/geolocation';

interface RequestListPanelProps {
  data: any[];
  loading: boolean;
  userRole: 'food_giver' | 'food_receiver';
  userLocation: LocationCoords | null;
  currentUserId?: string;
  onUpdate?: () => void;
  onMessageClick?: (receiverId: string) => void;
}

const RequestListPanel = ({ 
  data, 
  loading, 
  userRole, 
  userLocation,
  currentUserId,
  onUpdate,
  onMessageClick 
}: RequestListPanelProps) => {
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
            No food requests available. Check back later!
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4 pb-24">
        {data.map((item) => (
          <RequestCard
            key={item.id}
            request={item}
            isOwner={userRole === 'food_receiver' && item.receiver_id === currentUserId}
            showContact={userRole === 'food_giver'}
            onUpdate={onUpdate}
            onMessageClick={onMessageClick}
          />
        ))}
      </div>
    </ScrollArea>
  );
};

export default RequestListPanel;
