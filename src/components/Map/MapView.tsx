import { useEffect, useRef, useState, useCallback } from 'react';

import L from 'leaflet';
import { useMapData, MapDataItem } from '@/hooks/useMapData';
import { useUserLocation } from '@/hooks/useUserLocation';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import FoodCard from '../FoodCard';

// Boilerplate to fix Leaflet's default icon path issues
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

  // --- EFFECT 1: INITIALIZE THE MAP (Runs only ONCE) ---
  // This is the stable pattern from your working example.
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      // Create the map with a default center.
      const map = L.map(mapContainerRef.current, { center: [13.0827, 80.2707], zoom: 13 });
      // Add the street tiles.
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',}).addTo(map);
      // Add the layer group that will hold our markers.
      dataMarkersRef.current.addTo(map);
      // Save the map instance to the ref so it persists.
      mapRef.current = map;
    }
  }, []); // The empty array ensures this runs only one time.

  // --- EFFECT 2: UPDATE USER LOCATION (Runs when 'location' changes) ---
  useEffect(() => {
    // Only run if the map has been created and we have a user location.
    if (mapRef.current && location) {
      // Move the map's view to the user's location.
      mapRef.current.setView([location.lat, location.lng], 15);
      // Create or update the user's blue dot marker.
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([location.lat, location.lng]);
      } else {
        // You can customize this marker to look different if you want.
        userMarkerRef.current = L.marker([location.lat, location.lng]).addTo(mapRef.current);
      }
    }
  }, [location]);

  // --- EFFECT 3: UPDATE DATA MARKERS (Runs when 'data' changes) ---
  useEffect(() => {
    if (!mapRef.current || !data) return;
    // Clear all old markers.
    dataMarkersRef.current.clearLayers();
    // Add new markers for each item in the data.
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
