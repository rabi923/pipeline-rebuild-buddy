import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Package, User, Navigation, Trash2, MessageCircle, ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { calculateDistance, formatDistance } from "@/utils/distanceCalculator";
import type { LocationCoords } from "@/utils/geolocation";
import { useState } from "react";

interface FoodCardProps {
  listing: any;
  isOwner?: boolean;
  showContact?: boolean;
  onUpdate?: () => void;
  userLocation?: LocationCoords | null;
  onMessageClick?: (giverId: string) => void;
}

const FoodCard = ({ listing, isOwner, showContact, onUpdate, userLocation, onMessageClick }: FoodCardProps) => {
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);

  const distance = userLocation && listing.latitude && listing.longitude
    ? calculateDistance(userLocation, { lat: listing.latitude, lng: listing.longitude })
    : null;

  // Handle both image_urls array and photo_url
  const imageUrl = listing.image_urls?.[0] || listing.photo_url;
  
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this listing?')) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('food_listings')
        .delete()
        .eq('id', listing.id);

      if (error) throw error;

      toast.success("Listing deleted successfully");
      onUpdate?.();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error("Failed to delete listing");
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleAvailability = async () => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('food_listings')
        .update({ is_available: !listing.is_available })
        .eq('id', listing.id);

      if (error) throw error;

      toast.success(listing.is_available ? "Marked as unavailable" : "Marked as available");
      onUpdate?.();
    } catch (error) {
      console.error('Update error:', error);
      toast.error("Failed to update availability");
    } finally {
      setUpdating(false);
    }
  };

  const handleMessageClick = () => {
    if (listing.giver_id && onMessageClick) {
      onMessageClick(listing.giver_id);
    }
  };

  return (
    <Card className="overflow-hidden shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-soft)] transition-all duration-300">
      {imageUrl ? (
        <div className="h-48 w-full overflow-hidden bg-muted relative group">
          <img
            src={imageUrl}
            alt={listing.title || 'Food item'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              // Fallback if image fails to load
              e.currentTarget.style.display = 'none';
            }}
          />
          {!listing.is_available && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="secondary" className="text-base">
                Unavailable
              </Badge>
            </div>
          )}
        </div>
      ) : (
        <div className="h-48 w-full bg-muted flex items-center justify-center">
          <ImageIcon className="h-12 w-12 text-muted-foreground" />
        </div>
      )}

      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-xl font-semibold flex-1 line-clamp-2">
            {listing.title || 'Food Item'}
          </h3>
          {listing.food_type && (
            <Badge variant="secondary" className="shrink-0">
              {listing.food_type}
            </Badge>
          )}
        </div>

        {listing.description && (
          <p className="text-muted-foreground text-sm line-clamp-2">
            {listing.description}
          </p>
        )}

        <div className="space-y-2 text-sm">
          {listing.quantity && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Package className="h-4 w-4 shrink-0" />
              <span>Quantity: {listing.quantity}</span>
            </div>
          )}

          {listing.pickup_time && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 shrink-0" />
              <span>Pickup: {format(new Date(listing.pickup_time), 'MMM d, h:mm a')}</span>
            </div>
          )}

          {listing.location && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="line-clamp-1">{listing.location}</span>
            </div>
          )}

          {distance !== null && (
            <div className="flex items-center gap-2 text-primary font-medium">
              <Navigation className="h-4 w-4 shrink-0" />
              <span>{formatDistance(distance)} away</span>
            </div>
          )}

          {showContact && (listing.giver?.full_name || listing.profiles?.full_name) && (
            <div className="flex items-center gap-2 text-muted-foreground border-t pt-2 mt-2">
              <User className="h-4 w-4 shrink-0" />
              <span>Contact: {listing.giver?.full_name || listing.profiles?.full_name}</span>
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
              disabled={updating || deleting}
            >
              {updating ? 'Updating...' : listing.is_available ? "Mark Unavailable" : "Mark Available"}
            </Button>
            <Button
              variant="destructive"
              size="icon"
              onClick={handleDelete}
              disabled={deleting || updating}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        ) : showContact && listing.giver_id ? (
          <Button
            className="w-full"
            onClick={handleMessageClick}
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
