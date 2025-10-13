import React, { useState } from 'react';
// --- Re-adding Leaflet imports ---
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
// --- End of re-added imports ---

import BottomNavigation from './BottomNavigation';
import AddFoodDialog from '../AddFoodDialog';
import { Loader2 } from 'lucide-react';

// --- We are now re-adding the Leaflet icon fix. ---
// This part is important because it might be the source of the original error.
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
  const handleTabChange = (tab: string) => {
    if (tab === 'add') {
      setShowAddDialog(true);
    } else {
      onTabChange(tab);
    }
  };
  const refetch = () => { console.log("Refetch called"); };

  // Hardcoded default center for the map
  const defaultCenter: [number, number] = [13.0827, 80.2707];

  return (
    <div className="relative h-screen w-full">
      
      {/* --- The MapContainer is now being rendered --- */}
      <MapContainer
        center={defaultCenter}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: '100vh', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a hr
