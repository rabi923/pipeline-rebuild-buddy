import React, { useState, useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import BottomNavigation from './BottomNavigation';
import AddFoodDialog from '../AddFoodDialog';
import { useUserLocation } from '@/hooks/useUserLocation';
// NOTE: useMapData is intentionally NOT imported yet
import { Loader2 } from 'lucide-react';

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
  console.log("MapView component rendered.");

  // --- We are re-adding ONLY the user location hook ---
  const { location: userLocation, loading: locationLoading } = useUserLocation();
  
  // --- The map data hook remains disabled for this test ---
  const data = []; 
  const refetch = () => { console.log("Refetch called"); };

  const [showAddDialog, setShowAddDialog] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  // --- ADDING DEBUG LOGS ---
  useEffect(() => {
    console.log("Hook state changed:");
    console.log("  - Is Location Loading:", locationLoading);
    console.log("  - Location Object:", userLocation);
  }, [locationLoading, userLocation]);

  useEffect(() => {
    // Initialize the map once
    if (mapContainerRef.current && !mapRef.current) {
      console.log("Initializing map...");
      mapRef.current = L.map(mapContainerRef.current).setView([13.0827, 80.2707], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current);
    }
  }, []);

  useEffect(() => {
    // Pan the map and add a marker when location is found
    if (mapRef.current && userLocation) {
      console.log("User location found! Panning map to:", userLocation);
      mapRef.current.setView([userLocation.lat, userLocation.lng], 14);
      L.marker([userLocation.lat, userLocation.lng])
        .addTo(mapRef.current)
        .bindPopup('You are here.');
    }
  }, [userLocation]);


  const handleTabChange = (tab: string) => {
    if (tab === 'add') setShowAddDialog(true);
    else onTabChange(tab);
  };
  
  // This loading state now depends on the real hook
  if (locationLoading) {
    console.log("Displaying the 'Finding your location...' loading screen.");
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Finding your location...</p>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full">
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
          onSuccess={() => { 
            refetch();
            setShowAddDialog(false);
          }}
        />
      )}
    </div>
  );
};

export default MapView;
