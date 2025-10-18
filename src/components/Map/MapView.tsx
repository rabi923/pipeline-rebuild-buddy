import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useState, useEffect } from 'react';
import { useMapData } from '@/hooks/useMapData';
import { useUserLocation } from '@/hooks/useUserLocation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import FoodCard from '../FoodCard';
import type { MapDataItem } from '@/hooks/useMapData';
// ========================= THIS IS THE FINAL FIX =========================
// The import path is now corrected to match your existing file name.
import { useIsMobile } from '@/hooks/use-is-mobile';
// =======================================================================

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

export type OtherUser = { id: string; fullName: string; avatarUrl?: string | null };
interface MapViewProps { userRole: 'food_giver' | 'food_receiver'; onStartChat: (user: OtherUser) => void; }

const Recenter = ({ lat, lng }: { lat: number, lng: number }) => {
  const map = useMap();
  useEffect(() => { map.setView([lat, lng]); }, [lat, lng, map]);
  return null;
};

const MapView = ({ userRole, onStartChat }: MapViewProps) => {
  const isMobile = useIsMobile();
  const { location, error: locationError, loading: locationLoading } = useUserLocation();
  const { data, loading: dataLoading } = useMapData(userRole, location);
  const [selectedItem, setSelectedItem] = useState<MapDataItem | null>(null);

  if (locationLoading || dataLoading) {
    return <div className="h-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  if (!location) { return <div className="p-4 text-center">Please enable location services.</div>; }

  const handleMessageClick = (otherUser: OtherUser) => {
    setSelectedItem(null);
    onStartChat(otherUser);
  };

  const mapContent = (
    <MapContainer center={[location.lat, location.lng]} zoom={14} style={{ height: '100%', width: '100%' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{y}.png" attribution='&copy; OpenStreetMap' />
      {data.map((item) => {
        if (!item.latitude || !item.longitude) return null;
        return (
          <Marker
            key={item.id}
            position={[item.latitude, item.longitude]}
            eventHandlers={{ click: () => { if (userRole === 'food_receiver') setSelectedItem(item); } }}
          >
            {!isMobile && (
              <Popup>
                <div className="p-1">
                  <h4 className="font-bold">{item.title || item.notes}</h4>
                  <p className="text-sm">{item.quantity}</p>
                  {userRole === 'food_receiver' && item.giver && (
                    <Button size="sm" className="mt-2 w-full" onClick={() => handleMessageClick({ id: item.giver.id, fullName: item.giver.full_name })}>Message Giver</Button>
                  )}
                </div>
              </Popup>
            )}
          </Marker>
        );
      })}
      <Recenter lat={location.lat} lng={location.lng} />
    </MapContainer>
  );

  return (
    <>
      {mapContent}
      {isMobile && (
        <Dialog open={!!selectedItem} onOpenChange={(isOpen) => !isOpen && setSelectedItem(null)}>
          <DialogContent className="max-w-md w-[95%] p-0 border-0 rounded-lg">
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
      )}
    </>
  );
};

export default MapView;
