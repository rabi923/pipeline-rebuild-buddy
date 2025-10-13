import React, { useState, useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import BottomNavigation from './BottomNavigation';
import AddFoodDialog from '../AddFoodDialog';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useMapData } from '@/hooks/useMapData';
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
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  const { location: userLocation, loading: locationLoading } = useUserLocation();
  const { data, loading: dataLoading, refetch } = useMapData(userRole, userLocation);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const dataMarkersRef = useRef<L.LayerGroup>(L.layerGroup());

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        center: [13.0827, 80.2707],
        zoom: 13,
        zoomControl: false // We can disable the default zoom control for a cleaner look
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current);

      dataMarkersRef.current.addTo(mapRef.current);
      
      // Optionally, add a new zoom control in a better position
      L.control.zoom({ position: 'topright' }).addTo(mapRef.current);
    }
  }, []);

  useEffect(() => {
    if (mapRef.current && userLocation) {
      mapRef.current.setView([userLocation.lat, userLocation.lng], 15);
      
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
      } else {
        userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng])
          .addTo(mapRef.current)
          .bindPopup('You are here.');
      }
    }
  }, [userLocation]);

  useEffect(() => {
    if (mapRef.current && data) {
      dataMarkersRef.current.clearLayers();
      data.forEach(item => {
        if (item.latitude && item.longitude) {
          const popupContent = `<h3>${item.title || 'Food Item'}</h3><p>${item.description || ''}</p>`;
          L.marker([item.latitude, item.longitude])
            .bindPopup(popupContent)
            .addTo(dataMarkersRef.current);
        }
      });
    }
  }, [data]);

  const handleTabChange = (tab: string) => {
    if (tab === 'add') setShowAddDialog(true);
    else onTabChange(tab);
  };
  
  return (
    <div className="relative h-screen w-full">
      <div id="map" ref={mapContainerRef} style={{ height: '100vh', width: '100%' }} />

      {(locationLoading || dataLoading) && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white rounded-full shadow-lg p-2 flex items-center z-[1000]">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">
            {locationLoading ? "Finding location..." : "Loading data..."}
          </span>
        </div>
      )}

      {/* --- FIX: Wrapper with a high z-index to ensure it's on top of the map --- */}
      <div className="relative z-[1000]">
        <BottomNavigation
          currentTab="map"
          onTabChange={handleTabChange}
          userRole={userRole}
        />
      </div>
      {/* --- END OF FIX --- */}


      {userRole === 'food_giver' && (
        <AddFoodDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
