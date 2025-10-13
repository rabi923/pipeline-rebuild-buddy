import React, { useState, useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Re-adding the components and hooks that provide the app's functionality
import BottomNavigation from './BottomNavigation';
import AddFoodDialog from '../AddFoodDialog';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useMapData } from '@/hooks/useMapData';
import { Loader2 } from 'lucide-react';

// The Leaflet icon fix is still necessary for the base library to find its images
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
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  // --- Re-adding your custom hooks ---
  const { location: userLocation, loading: locationLoading } = useUserLocation();
  const { data, loading: dataLoading, refetch } = useMapData(userRole, userLocation);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  // This layer group will hold all the food data markers, so we can easily clear them
  const markersLayerRef = useRef<L.LayerGroup>(L.layerGroup());

  useEffect(() => {
    // This effect runs only ONCE to initialize the map
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView([13.0827, 80.2707], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current);
      // Add the empty layer group to the map, ready to hold markers
      markersLayerRef.current.addTo(mapRef.current);
    }
  }, []);

  useEffect(() => {
    // This effect runs whenever the user's location is found
    if (mapRef.current && userLocation) {
      mapRef.current.setView([userLocation.lat, userLocation.lng], 14); // Zoom in closer
      L.marker([userLocation.lat, userLocation.lng])
        .addTo(mapRef.current)
        .bindPopup('You are here.');
    }
  }, [userLocation]);

  useEffect(() => {
    // This effect runs whenever the food `data` changes
    if (mapRef.current && data) {
      // 1. Clear all old markers from the layer group
      markersLayerRef.current.clearLayers();

      // 2. Loop through the new data and add markers
      data.forEach(item => {
        if (item.latitude && item.longitude) {
          const popupContent = `
            <div class="p-1">
              <h3 class="font-semibold text-base mb-1">${item.title || item.food_type || 'Food Item'}</h3>
              <p class="text-sm">${item.description || ''}</p>
            </div>
          `;
          L.marker([item.latitude, item.longitude])
            .bindPopup(popupContent)
            .addTo(markersLayerRef.current); // Add to the group, not the map directly
        }
      });
    }
  }, [data]);

  const handleTabChange = (tab: string) => {
    if (tab === 'add') setShowAddDialog(true);
    else onTabChange(tab);
  };
  
  // --- Re-adding the loading state ---
  if (locationLoading) {
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
            refetch(); // This will now correctly refetch data after adding a new item
            setShowAddDialog(false);
          }}
        />
      )}
    </div>
  );
};

export default MapView;
