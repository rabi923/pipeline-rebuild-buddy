import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Users, AlertCircle, Trash2, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RequestCardProps {
  request: any;
  isOwner?: boolean;
  showContact?: boolean;
  onUpdate?: () => void;
  onMessageClick?: (receiverId: string) => void;
}

const RequestCard = ({ request, isOwner, showContact, onUpdate, onMessageClick }: RequestCardProps) => {
  const handleDelete = async () => {
    const { error } = await supabase
      .from('food_requests')
      .delete()
      .eq('id', request.id);

    if (error) {
      toast.error("Failed to delete request");
      return;
    }

    toast.success("Request deleted");
    onUpdate?.();
  };

  const handleUpdateStatus = async (newStatus: string) => {
    const { error } = await supabase
      .from('food_requests')
      .update({ status: newStatus })
      .eq('id', request.id);

    if (error) {
      toast.error("Failed to update status");
      return;
    }

    toast.success(`Request marked as ${newStatus}`);
    onUpdate?.();
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <Card className="overflow-hidden shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-soft)] transition-shadow">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-xl font-semibold flex-1">
            {request.organization_name || 'Food Request'}
          </h3>
          <Badge variant={getUrgencyColor(request.urgency_level)}>
            {request.urgency_level}
          </Badge>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4 shrink-0" />
            <span>For {request.people_count} people</span>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Food Type: {request.food_preference}</span>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 shrink-0" />
            <span>Needed by: {format(new Date(request.needed_by), 'MMM d, h:mm a')}</span>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="line-clamp-1">{request.location_address}</span>
          </div>

          {request.notes && (
            <p className="text-muted-foreground text-sm border-t pt-2 line-clamp-2">
              {request.notes}
            </p>
          )}

          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {request.delivery_preference === 'pickup' ? 'Pickup' : 'Delivery'}
            </Badge>
            <Badge variant={request.status === 'active' ? 'default' : 'secondary'}>
              {request.status}
            </Badge>
          </div>

          {showContact && request.receiver && (
            <div className="flex items-center gap-2 text-muted-foreground border-t pt-2 mt-2">
              <span>Organization: {request.receiver.organization_name || request.receiver.full_name}</span>
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
              onClick={() => handleUpdateStatus(request.status === 'active' ? 'fulfilled' : 'active')}
            >
              {request.status === 'active' ? 'Mark Fulfilled' : 'Mark Active'}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        ) : showContact && request.receiver_id ? (
          <Button
            className="w-full"
            onClick={() => onMessageClick?.(request.receiver_id)}
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Message Organization
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
};

export default RequestCard;
