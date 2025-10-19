import { useEffect, useRef, useState, useCallback } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useMapData, MapDataItem } from '@/hooks/useMapData';
import { useUserLocation } from '@/hooks/useUserLocation';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import FoodCard from '../FoodCard';
import RequestCard from '../RequestCard'; // Import RequestCard

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

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      const map = L.map(mapContainerRef.current, { center: [13.0827, 80.2707], zoom: 13 });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',}).addTo(map);
      dataMarkersRef.current.addTo(map);
      mapRef.current = map;
    }
  }, []);

  useEffect(() => {
    if (mapRef.current && location) {
      mapRef.current.setView([location.lat, location.lng], 15);
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([location.lat, location.lng]);
      } else {
        userMarkerRef.current = L.marker([location.lat, location.lng]).addTo(mapRef.current).bindPopup('You are here.');
      }
    }
  }, [location]);

  useEffect(() => {
    if (!mapRef.current || !data) return;
    dataMarkersRef.current.clearLayers();
    data.forEach((item: MapDataItem) => {
      if (item.latitude && item.longitude) {
        const marker = L.marker([item.latitude, item.longitude]);
        marker.on('click', () => { setSelectedItem(item); });
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
      {(locationLoading || dataLoading) && !location && (
        <div className="absolute inset-0 flex items-center justify-center bg-background z-[1001]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      <div ref={mapContainerRef} style={{ height: '100%', width: '100%', zIndex: 0 }} />
      <Dialog open={!!selectedItem} onOpenChange={(isOpen) => !isOpen && setSelectedItem(null)}>
        <DialogContent className="max-w-md w-[95%] p-0 border-0">
          {selectedItem && userRole === 'food_receiver' && (
            <FoodCard 
              listing={selectedItem} 
              userLocation={location}
              showContact
              onMessageClick={() => selectedItem.giver && handleMessageClick({ id: selectedItem.giver.id, fullName: selectedItem.giver.full_name, avatarUrl: selectedItem.giver.profile_picture_url })}
            />
          )}
          {selectedItem && userRole === 'food_giver' && (
            <RequestCard 
              request={selectedItem}
              showContact
              onMessageClick={() => selectedItem.receiver && handleMessageClick({ id: selectedItem.receiver.id, fullName: selectedItem.receiver.full_name || 'Receiver', avatarUrl: selectedItem.receiver.profile_picture_url })}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MapView;
