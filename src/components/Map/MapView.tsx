import React, { useState, useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import BottomNavigation from './BottomNavigation';
import AddFoodDialog from '../AddFoodDialog';

// --- THE LEAFLET ICON FIX - Still needed for the base library ---
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;
// --- End of icon fix ---

interface MapViewProps {
  userRole: 'food_giver' | 'food_receiver';
  onTabChange: (tab: string) => void;
}

const MapView = ({ userRole, onTabChange }: MapViewProps) => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  // Create a ref to hold the map instance
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    // This code runs only once after the component mounts
    if (mapContainerRef.current && !mapRef.current) {
      // Initialize the map on the div element
      mapRef.current = L.map(mapContainerRef.current).setView([13.0827, 80.2707], 13);

      // Add the tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current);
    }
  }, []); // Empty dependency array ensures this runs only once

  const handleTabChange = (tab: string) => {
    if (tab === 'add') {
      setShowAddDialog(true);
    } else {
      onTabChange(tab);
    }
  };

  const refetch = () => { console.log("Refetch called"); };

  return (
    <div className="relative h-screen w-full">
      
      {/* This div is the container where the Leaflet map will be rendered */}
      <div id="map" ref={mapContainerRef} style={{ height: '100vh', width: '100%' }} />

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
