import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Upload, X, Camera, Image as ImageIcon } from "lucide-react";
import { compressImage } from "@/utils/imageCompression";
import { useUserLocation } from "@/hooks/useUserLocation";

interface AddFoodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AddFoodDialog = ({ open, onOpenChange, onSuccess }: AddFoodDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const { location: userLocation } = useUserLocation();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    quantity: "",
    pickup_time: "",
    location: "",
    food_type: "",
    latitude: null as number | null,
    longitude: null as number | null,
  });

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = 5 - selectedFiles.length;
    const filesToAdd = files.slice(0, remainingSlots);

    if (files.length > remainingSlots) {
      toast.info(`Only ${remainingSlots} more images can be added (max 5 total)`);
    }

    const newPreviews: string[] = [];
    for (const file of filesToAdd) {
      const reader = new FileReader();
      const preview = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      newPreviews.push(preview);
    }

    setSelectedFiles(prev => [...prev, ...filesToAdd]);
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const removePhoto = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (userId: string): Promise<string[]> => {
    if (selectedFiles.length === 0) return [];
    setUploading(true);
    try {
      const uploadPromises = selectedFiles.map(async (file) => {
        const compressedFile = await compressImage(file);
        const fileExt = 'webp';
        const fileName = `${userId}/${Date.now()}_${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('food-photos').upload(fileName, compressedFile, { cacheControl: '3600', upsert: false });
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('food-photos').getPublicUrl(fileName);
        return publicUrl;
      });
      const urls = await Promise.all(uploadPromises);
      return urls;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const imageUrls = await uploadImages(session.user.id);
      const latitude = userLocation?.lat || null;
      const longitude = userLocation?.lng || null;

      const { error: insertError } = await supabase.from('food_listings').insert({
        giver_id: session.user.id,
        title: formData.title,
        description: formData.description,
        quantity: formData.quantity,
        pickup_time: formData.pickup_time,
        location: formData.location,
        food_type: formData.food_type,
        latitude,
        longitude,
        image_urls: imageUrls,
        is_available: true,
      });

      if (insertError) throw insertError;
      toast.success("Food listing created!");
      onSuccess();
      onOpenChange(false);

      setFormData({ title: "", description: "", quantity: "", pickup_time: "", location: "", food_type: "", latitude: null, longitude: null });
      setSelectedFiles([]);
      setImagePreviews([]);
    } catch (error: any) {
      toast.error(error.message || "Failed to create listing");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto z-[2000]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Add Food Listing</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Food Photos (Optional, up to 5)</Label>
            {imagePreviews.length > 0 ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-32 object-cover rounded-lg"/>
                      <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-7 w-7" onClick={() => removePhoto(index)}><X className="h-4 w-4" /></Button>
                      {index === 0 && <span className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">Main</span>}
                    </div>
                  ))}
                </div>
                {imagePreviews.length < 5 && (
                  <label className="flex items-center justify-center w-full h-12 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <Upload className="h-5 w-5 text-muted-foreground mr-2" />
                    <span className="text-sm text-muted-foreground">Add More ({5 - imagePreviews.length} remaining)</span>
                    <input type="file" accept="image/*" multiple onChange={handlePhotoChange} className="hidden" />
                  </label>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground mb-1">Click to add photos</span>
                  <span className="text-xs text-muted-foreground">Or drag and drop (max 5)</span>
                  <input type="file" accept="image/*" multiple onChange={handlePhotoChange} className="hidden" />
                </label>
                <div className="flex gap-2">
                  <label className="flex-1 flex items-center justify-center h-10 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <Camera className="h-4 w-4 text-muted-foreground mr-2" /><span className="text-sm">Camera</span>
                    <input type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} className="hidden" />
                  </label>
                  <label className="flex-1 flex items-center justify-center h-10 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <ImageIcon className="h-4 w-4 text-muted-foreground mr-2" /><span className="text-sm">Gallery</span>
                    <input type="file" accept="image/*" multiple onChange={handlePhotoChange} className="hidden" />
                  </label>
                </div>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Food Title *</Label>
            <Input id="title" placeholder="e.g., Fresh vegetables, Cooked rice" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" placeholder="Describe the food..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              {/* --- THIS LINE IS NOW FIXED --- */}
              <Input id="quantity" placeholder="e.g., 2 plates, 5kg" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="food_type">Food Type</Label>
              <Input id="food_type" placeholder="e.g., Vegetarian" value={formData.food_type} onChange={(e) => setFormData({ ...formData, food_type: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pickup_time">Pickup Time *</Label>
            <Input id="pickup_time" type="datetime-local" value={formData.pickup_time} onChange={(e) => setFormData({ ...formData, pickup_time: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Pickup Location *</Label>
            <Input id="location" placeholder="Enter address or area" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} required />
          </div>
          <Button type="submit" className="w-full h-12" disabled={loading || uploading}>
            {loading || uploading ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" />{uploading ? "Uploading images..." : "Creating listing..."}</>
            ) : "Create Listing"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddFoodDialog;
