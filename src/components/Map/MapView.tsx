// src/components/Map/MapView.tsx (Final, Corrected Version)

import React, { useState, useEffect, useRef, useCallback } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
// --- CHANGE: We no longer need ReactDOMServer
// import ReactDOMServer from 'react-dom/server'; 

// --- CHANGE: Import the Dialog component and FoodCard
import { Dialog, DialogContent } from '@/components/ui/dialog';
import FoodCard from '../FoodCard';

// --- CHANGE: Import our central FoodListing type
// --- ADD THESE NEW TYPE DEFINITIONS DIRECTLY IN THIS FILE ---
// This defines the shape of the 'giver' profile attached to each listing
interface GiverProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
  profile_picture_url: string | null;
  organization_name: string | null;
}
// This is the main type for your food listings.
export interface FoodListing {
  id: string; created_at: string; giver_id: string; title: string;
  description: string | null; quantity: string; pickup_time: string;
  photo_url: string | null; image_urls: string[] | null; location: string;
  latitude: number | null; longitude: number | null; food_type: string | null;
  is_available: boolean; view_count: number; updated_at: string;
  giver: GiverProfile | null;
}
// --- END OF NEW CODE ---

import BottomNavigation from './BottomNavigation';
import AddFoodDialog from '../AddFoodDialog';
import FoodListPanel from './FoodListPanel';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useMapData } from '@/hooks/useMapData';
import { Loader2 } from 'lucide-react'; // MessageSquare is no longer needed here
import { supabase } from '@/integrations/supabase/client';
import ChatWindow from '../Chat/ChatWindow';

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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [chatUser, setChatUser] = useState<{ id: string; name: string; avatar?: string | null } | null>(null);
  
  // --- CHANGE: Add state for the listing popup dialog ---
  const [selectedListing, setSelectedListing] = useState<FoodListing | null>(null);

  const { location: userLocation, loading: locationLoading } = useUserLocation();
  const { data, loading: dataLoading, refetch } = useMapData(userRole, userLocation);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const dataMarkersRef = useRef<L.LayerGroup>(L.layerGroup());

  // This useEffect hook is unchanged
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getUser();
  }, []);

  // This useEffect hook is unchanged
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, { center: [13.0827, 80.2707], zoom: 13, zoomControl: false });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(mapRef.current);
      dataMarkersRef.current.addTo(mapRef.current);
      L.control.zoom({ position: 'topright' }).addTo(mapRef.current);
    }
  }, []);

  // This useEffect hook is unchanged
  useEffect(() => {
    if (mapRef.current && userLocation) {
      mapRef.current.setView([userLocation.lat, userLocation.lng], 15);
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
      } else {
        userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng]).addTo(mapRef.current).bindPopup('You are here.');
      }
    }
  }, [userLocation]);

  // --- CHANGE: The `handleMessageClick` from the panel should also open the chat ---
  const handleMessageClick = useCallback(async (giverId: string) => {
    const { data: profile } = await supabase.from('profiles').select('full_name, profile_picture_url').eq('id', giverId).single();
    if (profile) {
      setChatUser({ id: giverId, name: profile.full_name || 'Unknown User', avatar: profile.profile_picture_url });
    }
  }, []);


  // --- THIS IS THE KEY MODIFIED SECTION ---
  useEffect(() => {
    // Check if map and data are ready
    if (!mapRef.current || !data) return;
  
    // Clear any markers from the previous data load
    dataMarkersRef.current.clearLayers();
  
    // Handle both food_listings (for receivers) and food_requests (for givers)
    data.forEach((item: any) => { 
      if (item.latitude && item.longitude) {
        const marker = L.marker([item.latitude, item.longitude]);
        
        // For food_receiver role, data is food_listings
        // For food_giver role, data is food_requests (not shown in popup)
        marker.on('click', () => {
          // Only set selected listing if it's a food listing (receiver view)
          if (userRole === 'food_receiver' && item.giver_id) {
            setSelectedListing(item as FoodListing);
          }
        });
        
        // Add the configured marker to the map
        marker.addTo(dataMarkersRef.current);
      }
    });
  }, [data, userRole]);
  // --- END OF KEY MODIFIED SECTION ---


  const handleTabChange = (tab: string) => {
    if (tab === 'add') setShowAddDialog(true);
    else onTabChange(tab);
  };

  if (chatUser) {
    return <ChatWindow otherUserId={chatUser.id} otherUserName={chatUser.name} otherUserAvatar={chatUser.avatar} onBack={() => setChatUser(null)} />;
  }
  
  return (
    <div className="relative h-screen w-full flex">
      <div className="flex-1 relative">
        <div id="map" ref={mapContainerRef} style={{ height: '100vh', width: '100%' }} />
        {(locationLoading || dataLoading) && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-[998]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
      </div>

      <div className="hidden md:block w-96 border-l bg-background">
        <FoodListPanel data={data} loading={dataLoading} userRole={userRole} userLocation={userLocation} currentUserId={currentUserId} onUpdate={refetch} onMessageClick={handleMessageClick}/>
      </div>

      <div className="md:hidden absolute bottom-20 left-0 right-0 max-h-[40vh] bg-background border-t z-[999]">
        <FoodListPanel data={data} loading={dataLoading} userRole={userRole} userLocation={userLocation} currentUserId={currentUserId} onUpdate={refetch} onMessageClick={handleMessageClick}/>
      </div>

      <div className="relative z-[1000]">
        <BottomNavigation currentTab="map" onTabChange={handleTabChange} userRole={userRole}/>
      </div>
      
      {/* --- CHANGE: Add the Dialog for the FoodCard popup --- */}
      <Dialog open={!!selectedListing} onOpenChange={(isOpen) => !isOpen && setSelectedListing(null)}>
        <DialogContent className="max-w-md w-[95%] p-0 border-0 rounded-lg">
          {selectedListing && (
            <FoodCard
              listing={selectedListing}
              userLocation={userLocation}
              showContact={userRole === 'food_receiver'}
              isOwner={selectedListing.giver_id === currentUserId}
              onMessageClick={(giverId) => {
                // First, close the dialog so the UI is clean
                setSelectedListing(null); 
                // Then, trigger the existing function to open the chat window
                handleMessageClick(giverId);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      {/* --- END OF CHANGE --- */}

      {userRole === 'food_giver' && (
        <AddFoodDialog open={showAddDialog} onOpenChange={setShowAddDialog} onSuccess={() => { refetch(); setShowAddDialog(false); }}/>
      )}
    </div>
  );
};

export default MapView;
