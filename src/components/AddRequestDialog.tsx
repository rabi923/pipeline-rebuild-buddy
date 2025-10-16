import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUserLocation } from "@/hooks/useUserLocation";

interface AddRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const AddRequestDialog = ({ open, onOpenChange, onSuccess }: AddRequestDialogProps) => {
  const [loading, setLoading] = useState(false);
  const { location } = useUserLocation();
  const [formData, setFormData] = useState({
    organization_name: "",
    people_count: "",
    food_preference: "",
    urgency_level: "medium",
    needed_by: "",
    location_address: "",
    delivery_preference: "pickup",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!location) {
      toast.error("Unable to get your location. Please enable location services.");
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      const { error } = await supabase.from('food_requests').insert({
        receiver_id: user.id,
        organization_name: formData.organization_name || null,
        people_count: parseInt(formData.people_count),
        food_preference: formData.food_preference,
        urgency_level: formData.urgency_level,
        needed_by: formData.needed_by,
        location_address: formData.location_address,
        latitude: location.lat,
        longitude: location.lng,
        delivery_preference: formData.delivery_preference,
        notes: formData.notes || null,
        status: 'active',
      });

      if (error) throw error;

      toast.success("Food request created successfully!");
      onOpenChange(false);
      onSuccess?.();
      
      // Reset form
      setFormData({
        organization_name: "",
        people_count: "",
        food_preference: "",
        urgency_level: "medium",
        needed_by: "",
        location_address: "",
        delivery_preference: "pickup",
        notes: "",
      });
    } catch (error: any) {
      console.error('Error creating request:', error);
      toast.error(error.message || "Failed to create request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Food Request</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="organization_name">Organization Name (Optional)</Label>
            <Input
              id="organization_name"
              value={formData.organization_name}
              onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
              placeholder="Community Center, Shelter, etc."
            />
          </div>

          <div>
            <Label htmlFor="people_count">Number of People *</Label>
            <Input
              id="people_count"
              type="number"
              min="1"
              required
              value={formData.people_count}
              onChange={(e) => setFormData({ ...formData, people_count: e.target.value })}
              placeholder="e.g., 50"
            />
          </div>

          <div>
            <Label htmlFor="food_preference">Food Type Needed *</Label>
            <Input
              id="food_preference"
              required
              value={formData.food_preference}
              onChange={(e) => setFormData({ ...formData, food_preference: e.target.value })}
              placeholder="e.g., Vegetarian, Non-veg, Any"
            />
          </div>

          <div>
            <Label htmlFor="urgency_level">Urgency Level *</Label>
            <Select value={formData.urgency_level} onValueChange={(value) => setFormData({ ...formData, urgency_level: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="needed_by">Needed By *</Label>
            <Input
              id="needed_by"
              type="datetime-local"
              required
              value={formData.needed_by}
              onChange={(e) => setFormData({ ...formData, needed_by: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="location_address">Pickup/Delivery Address *</Label>
            <Input
              id="location_address"
              required
              value={formData.location_address}
              onChange={(e) => setFormData({ ...formData, location_address: e.target.value })}
              placeholder="Full address"
            />
          </div>

          <div>
            <Label htmlFor="delivery_preference">Preference *</Label>
            <Select value={formData.delivery_preference} onValueChange={(value) => setFormData({ ...formData, delivery_preference: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pickup">Pickup</SelectItem>
                <SelectItem value="delivery">Delivery</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any specific requirements or details..."
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Create Request"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddRequestDialog;
