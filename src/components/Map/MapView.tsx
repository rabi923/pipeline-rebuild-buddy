import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import BottomNavigation from './BottomNavigation';
import AddFoodDialog from '../AddFoodDialog';
import { Loader2 } from 'lucide-react';

// Re-adding the Leaflet icon fix.
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

const MapView = ({ userRole, onTabchange }: MapViewProps) => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const handleTabChange = (tab: string) => {
    if (tab === 'add') {
      setShowAddDialog(true);
    } else {
      onTabchange(tab); // Corrected to match the prop name
    }
  };
  const refetch = () => { console.log("Refetch called"); };

  const defaultCenter: [number, number] = [13.0827, 80.2707];

  return (
    <div className="relative h-screen w-full">
      
      <MapContainer
        center={defaultCenter}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: '100vh', width: '100%' }}
      >
        {/* --- THIS LINE HAS BEEN FIXED --- */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
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
