import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useMapData } from '@/hooks/useMapData';
import BottomNavigation from './BottomNavigation';
import AddFoodDialog from '../AddFoodDialog';
import { Loader2 } from 'lucide-react';

// Fix Leaflet default marker icons
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapViewProps {
  userRole: 'food_giver' | 'food_receiver';
  onTabChange: (tab: string) => void;
}

const MapView = ({ userRole, onTabChange }: MapViewProps) => {
  // --- MODIFICATION FOR DEBUGGING ---
  // We are temporarily disabling the custom hooks to see if they are the cause of the error.
  
  // const { location: userLocation, loading: locationLoading } = useUserLocation();
  // const { data, loading: dataLoading, refetch } = useMapData(userRole, userLocation);

  // We provide fake data so the rest of the component can render without the hooks.
  const userLocation = null;
  const locationLoading = false;
  const data: any[] = [];
  const dataLoading = false;
  const refetch = () => { console.log("Refetch called"); };
  // --- END OF MODIFICATION ---

  const [showAddDialog, setShowAddDialog] = useState(false);
  const handleTabChange = (tab: string) => {
    if (tab === 'add') {
      setShowAddDialog(true);
    } else {
      onTabChange(tab);
    }
  };

  if (locationLoading || dataLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const defaultCenter: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : [13.0827, 80.2707];

  return (
    <div className="relative h-screen w-full">
      <MapContainer
        center={defaultCenter}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: '100vh', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]}>
            <Popup>You are here</Popup>
          </Marker>
        )}
        {data && data.map((item) => {
          if (!item.latitude || !item.longitude) return null;
          return (
            <Marker 
              key={item.id} 
              position={[item.latitude, item.longitude]}
            >
              <Popup>
                {/* popup content */}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <BottomNavigation
        currentTab="map"
        onTabChange={handleTabChange}
        userRole={userRole}
      />

      {userRole === 'food_giver' && (
        <AddFoodDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onSuccess={() =>{ 
            refetch();
            setShowAddDialog(false);
          }}
        />
      )}
    </div>
  );
};

export default MapView;
