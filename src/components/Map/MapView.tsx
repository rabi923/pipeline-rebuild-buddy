import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Temporary dummy component to isolate the error.
// All react-leaflet code has been removed.

export type OtherUser = { 
  id: string;
  fullName: string;
  avatarUrl?: string | null;
};

interface MapViewProps {
  userRole: 'food_giver' | 'food_receiver';
  onStartChat: (user: OtherUser) => void;
}

const MapView = ({ userRole, onStartChat }: MapViewProps) => {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-muted p-4">
      <h1 className="text-2xl font-bold">Map Is Temporarily Disabled</h1>
      <p className="text-muted-foreground mt-2">This is a placeholder for debugging.</p>
      <p className="mt-4">Please try navigating to another tab like "Chat" or "Requests".</p>
      
      {/* Example button to test interaction */}
      <Button 
        className="mt-6"
        onClick={() => alert("Interaction works!")}
      >
        Test Button
      </Button>
    </div>
  );
};

export default MapView;
