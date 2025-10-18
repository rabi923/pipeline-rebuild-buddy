import { useEffect, useRef, useState, useCallback } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useMapData, MapDataItem } from '@/hooks/useMapData';
import { useUserLocation } from '@/hooks/useUserLocation';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import FoodCard from '../FoodCard';
// ReactDOM is no longer needed
// import ReactDOM from 'react-dom/client';

import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
const DefaultIcon = L.icon({ iconUrl, shadowUrl, iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

export type OtherUser = { id: string; fullName: string; avatarUrl?: string | null };

interface MapViewProps {
  userRole: 'food_giver' | 'food_receiver';
  onStartChat: (user: OtherUser) => void;
}

const MapView = ({ userRole, onStartChat }: MapViewProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const dataMarkersRef = useRef<L.LayerGroup>(L.layerGroup());
  
  const { location, loading: locationLoading } = useUserLocation();
  const { data, loading: dataLoading } = useMapData(userRole, location);
  const [selectedItem, setSelectedItem] = useState<MapDataItem | null>(null);

  // --- THIS IS THE KEY FIX ---
  // We combine the map initialization and the user location update into a single useEffect
  // that depends on the 'location' state.
  useEffect(() => {
    // Only proceed if the map container exists and we have a valid location.
    if (mapContainerRef.current && location) {
      // If the map hasn't been created yet...
      if (!mapRef.current) {
        // ...create it now. By this point, the container div is guaranteed to have a size.
        const map = L.map(mapContainerRef.current).setView([location.lat, location.lng], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(map);
        dataMarkersRef.current.addTo(map);
        mapRef.current = map;
      } else {
        // If the map already exists, just update its view.
        mapRef.current.setView([location.lat, location.lng], 15);
      }

      // Update the user's marker.
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([location.lat, location.lng]);
      } else {
        userMarkerRef.current = L.marker([location.lat, location.lng]).addTo(mapRef.current);
      }
    }
    // This effect runs whenever 'location' changes.
  }, [location]);

  // Effect to update data markers (this is unchanged and correct)
  useEffect(() => {
    if (!mapRef.current || !data) return;
    dataMarkersRef.current.clearLayers();
    data.forEach((item: MapDataItem) => {
      if (item.latitude && item.longitude) {
        const marker = L.marker([item.latitude, item.longitude]);
        marker.on('click', () => { if (userRole === 'food_receiver') setSelectedItem(item); });
        marker.addTo(dataMarkersRef.current);
      }
    });
  }, [data, userRole]);
  
  const handleMessageClick = useCallback((otherUser: OtherUser) => {
    setSelectedItem(null);
    onStartChat(otherUser);
  }, [onStartChat]);

  return (
    <div className="relative h-full w-full">
      {(locationLoading || dataLoading) && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-[1001]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      <div ref={mapContainerRef} style={{ height: '100%', width: '100%', zIndex: 0 }} />
      <Dialog open={!!selectedItem} onOpenChange={(isOpen) => !isOpen && setSelectedItem(null)}>
        <DialogContent className="max-w-md w-[95%] p-0 border-0">
          {selectedItem && (
            <FoodCard 
              listing={selectedItem} 
              userLocation={location}
              showContact
              onMessageClick={() => selectedItem.giver && handleMessageClick({ id: selectedItem.giver.id, fullName: selectedItem.giver.full_name, avatarUrl: selectedItem.giver.profile_picture_url })}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MapView;
