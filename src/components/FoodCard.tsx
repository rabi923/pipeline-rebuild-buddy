import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Package, User, Navigation, Trash2, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { calculateDistance, formatDistance } from "@/utils/distanceCalculator";
import type { LocationCoords } from "@/utils/geolocation";

interface FoodCardProps {
  listing: any;
  isOwner?: boolean;
  showContact?: boolean;
  onUpdate?: () => void;
  userLocation?: LocationCoords | null;
  onMessageClick?: (giverId: string) => void;
}

const FoodCard = ({ listing, isOwner, showContact, onUpdate, userLocation, onMessageClick }: FoodCardProps) => {
  const distance = userLocation && listing.latitude && listing.longitude
    ? calculateDistance(userLocation, { lat: listing.latitude, lng: listing.longitude })
    : null;
    
  const handleDelete = async () => {
    const { error } = await supabase
      .from('food_listings')
      .delete()
      .eq('id', listing.id);

    if (error) {
      toast.error("Failed to delete listing");
      return;
    }

    toast.success("Listing deleted");
    onUpdate?.();
  };

  const handleToggleAvailability = async () => {
    const { error } = await supabase
      .from('food_listings')
      .update({ is_available: !listing.is_available })
      .eq('id', listing.id);

    if (error) {
      toast.error("Failed to update availability");
      return;
    }

    toast.success(listing.is_available ? "Marked as unavailable" : "Marked as available");
    onUpdate?.();
  };

  return (
    <Card className="overflow-hidden shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-soft)] transition-shadow">
      {listing.photo_url && (
        <div className="h-48 w-full overflow-hidden bg-muted">
          <img
            src={listing.photo_url}
            alt={listing.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-xl font-semibold flex-1">{listing.title}</h3>
          {listing.food_type && (
            <Badge variant="secondary" className="shrink-0">
              {listing.food_type}
            </Badge>
          )}
        </div>

        {listing.description && (
          <p className="text-muted-foreground line-clamp-2">{listing.description}</p>
        )}

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Package className="h-4 w-4 shrink-0" />
            <span>Quantity: {listing.quantity}</span>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 shrink-0" />
            <span>Pickup: {format(new Date(listing.pickup_time), 'MMM d, h:mm a')}</span>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="line-clamp-1">{listing.location}</span>
          </div>

          {distance && (
            <div className="flex items-center gap-2 text-primary font-medium">
              <Navigation className="h-4 w-4 shrink-0" />
              <span>{formatDistance(distance)}</span>
            </div>
          )}

          {showContact && listing.profiles && (
            <div className="flex items-center gap-2 text-muted-foreground border-t pt-2 mt-2">
              <User className="h-4 w-4 shrink-0" />
              <span>Contact: {listing.profiles.full_name}</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 gap-2">
        {isOwner ? (
          <>
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleToggleAvailability}
            >
              {listing.is_available ? "Mark Unavailable" : "Mark Available"}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        ) : showContact && listing.giver_id ? (
          <Button
            className="w-full"
            onClick={() => onMessageClick?.(listing.giver_id)}
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Message Giver
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
};

export default FoodCard;
