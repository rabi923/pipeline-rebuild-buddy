import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';
import { useMapData, MapDataItem } from '@/hooks/useMapData';
// ========================== THE FIX IS HERE ==========================
// Change 1: Import the correct hook 'useUserLocation' from your existing file.
import { useUserLocation } from '@/hooks/useUserLocation';
// =====================================================================
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Fix for default Leaflet icon not appearing correctly
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

export type OtherUser = { 
  id: string;
  fullName: string;
  avatarUrl?: string | null;
};

interface MapViewProps {
  userRole: 'food_giver' | 'food_receiver';
  onStartChat: (user: OtherUser) => void;
}

const RecenterAutomatically = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => { map.setView([lat, lng]); }, [lat, lng, map]);
  return null;
};

const MapView = ({ userRole, onStartChat }: MapViewProps) => {
  // ========================== THE FIX IS HERE ==========================
  // Change 2: Call your hook by its correct name.
  const { location, error: locationError, loading: locationLoading } = useUserLocation();
  // =====================================================================
  const { data, loading: dataLoading, error: dataError } = useMapData(userRole, location);

  if (locationLoading || dataLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-muted-foreground">Loading Map...</p>
      </div>
    );
  }
  
  if (locationError || dataError) {
    return <div className="p-4 text-center text-red-500">Error: {locationError || 'Could not fetch map data.'}</div>;
  }

  // Handle case where location permission might be denied or location is still null
  if (!location) {
      return (
          <div className="p-4 text-center text-muted-foreground">
              Could not determine your location. Please ensure location services are enabled for your browser.
          </div>
      );
  }

  return (
    <MapContainer center={[location.lat, location.lng]} zoom={14} style={{ height: '100%', width: '100%' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' />
      
      {data.map((item: MapDataItem) => {
        const otherParty = userRole === 'food_receiver' ? item.giver : item.receiver;
        if (!item.latitude || !item.longitude || !otherParty) return null;

        return (
          <Marker key={item.id} position={[item.latitude, item.longitude]}>
            <Popup>
              <div className="space-y-1 text-sm">
                <h4 className="font-bold text-base">{item.title || item.notes || 'Food Item'}</h4>
                <p>By: {otherParty.organization_name || otherParty.full_name || 'Unknown'}</p>
                {item.quantity && <p>Quantity: {item.quantity}</p>}
                
                {userRole === 'food_receiver' && (
                  <Button 
                    onClick={() => onStartChat({ id: otherParty.id, fullName: otherParty.full_name || 'Unknown Giver', avatarUrl: otherParty.profile_picture_url })}
                    className="mt-2 w-full" size="sm"
                  >
                    Message Giver
                  </Button>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
      {location && <RecenterAutomatically lat={location.lat} lng={location.lng} />}
    </MapContainer>
  );
};

export default MapView;
