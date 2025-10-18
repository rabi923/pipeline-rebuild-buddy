import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useState } from 'react';
import { useMapData } from '@/hooks/useMapData';
import { useUserLocation } from '@/hooks/useUserLocation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import FoodCard from '../FoodCard';
import type { MapDataItem } from '@/hooks/useMapData';
import { useIsMobile } from '@/hooks/use-mobile'; // Correct import path
import { useEffect } from 'react';

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
  const { location, loading: locationLoading } = useUserLocation();
  const { data, loading: dataLoading, refetch } = useMapData(userRole, location);
  const [selectedItem, setSelectedItem] = useState<MapDataItem | null>(null);

  if (locationLoading || dataLoading) {
    return <div className="h-full w-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  if (!location) { return <div className="p-4 text-center">Please enable location services.</div>; }

  const handleMessageClick = (otherUser: OtherUser) => {
    setSelectedItem(null); onStartChat(otherUser);
  };

  return (
    <>
      <MapContainer center={[location.lat, location.lng]} zoom={14} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{y}.png" attribution='&copy; OpenStreetMap' />
        {data.map((item) => {
          if (!item.latitude || !item.longitude) return null;
          const otherParty = userRole === 'food_receiver' ? item.giver : item.receiver;
          if (!otherParty) return null;

          return (
            <Marker key={item.id} position={[item.latitude, item.longitude]} eventHandlers={{ click: () => { if (userRole === 'food_receiver') setSelectedItem(item); }}}>
              {!isMobile && (
                <Popup>
                  <div className="p-1 w-64">
                    <h4 className="font-bold">{item.title || 'Food Request'}</h4>
                    <p className="text-sm">By: {otherParty.full_name}</p>
                    <Button size="sm" className="mt-2 w-full" onClick={() => handleMessageClick({ id: otherParty.id, fullName: otherParty.full_name, avatarUrl: otherParty.profile_picture_url })}>
                      {userRole === 'food_receiver' ? 'Message Giver' : 'Message Receiver'}
                    </Button>
                  </div>
                </Popup>
              )}
            </Marker>
          );
        })}
        <Recenter lat={location.lat} lng={location.lng} />
      </MapContainer>

      {isMobile && (
        <Dialog open={!!selectedItem} onOpenChange={(isOpen) => !isOpen && setSelectedItem(null)}>
          <DialogContent className="max-w-md w-[95%] p-0 border-0">
            {selectedItem && (
              <FoodCard listing={selectedItem} userLocation={location} showContact
                onMessageClick={() => selectedItem.giver && handleMessageClick({ id: selectedItem.giver.id, fullName: selectedItem.giver.full_name, avatarUrl: selectedItem.giver.profile_picture_url })}/>
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default MapView;
