import React, { useState, useEffect, useRef, useCallback } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import ReactDOMServer from 'react-dom/server';

import BottomNavigation from './BottomNavigation';
import AddFoodDialog from '../AddFoodDialog';
import FoodListPanel from './FoodListPanel';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useMapData } from '@/hooks/useMapData';
import { Loader2, MessageSquare } from 'lucide-react'; // Added MessageSquare
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
  
  const { location: userLocation, loading: locationLoading } = useUserLocation();
  const { data, loading: dataLoading, refetch } = useMapData(userRole, userLocation);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const dataMarkersRef = useRef<L.LayerGroup>(L.layerGroup());

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        center: [13.0827, 80.2707],
        zoom: 13,
        zoomControl: false
      });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current);
      dataMarkersRef.current.addTo(mapRef.current);
      L.control.zoom({ position: 'topright' }).addTo(mapRef.current);
    }
  }, []);

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

  // Wrapped your handleMessageClick in useCallback for stability inside the useEffect hook
  const handleMessageClick = useCallback(async (giverId: string) => {
    const { data: profile } = await supabase.from('profiles').select('full_name, profile_picture_url').eq('id', giverId).maybeSingle();
    if (profile) {
      setChatUser({ id: giverId, name: profile.full_name || 'Unknown User', avatar: profile.profile_picture_url });
    }
  }, []);

  // --- THIS IS THE MODIFIED SECTION ---
  useEffect(() => {
    if (mapRef.current && data && currentUserId) {
      dataMarkersRef.current.clearLayers();
      data.forEach(item => {
        if (item.latitude && item.longitude) {
          const buttonId = `msg-btn-${item.id}`;
          const isOwnListing = item.giver_id === currentUserId;

          // Added a placeholder div for the button inside the popup's HTML
          const popupContent = `
            <div class="space-y-1">
              <h3 class="font-semibold text-base">${item.title || 'Food Item'}</h3>
              <p class="text-sm">${item.description || ''}</p>
              ${(userRole === 'food_receiver' && !isOwnListing) ? `<div id="${buttonId}" class="mt-2"></div>` : ''}
            </div>
          `;
          
          const marker = L.marker([item.latitude, item.longitude]).addTo(dataMarkersRef.current);
          
          // When the popup opens, find the placeholder and inject a real button
          marker.bindPopup(popupContent).on('popupopen', () => {
            if (userRole === 'food_receiver' && !isOwnListing) {
              const container = document.getElementById(buttonId);
              if (container) {
                const button = document.createElement('button');
                button.innerHTML = ReactDOMServer.renderToString(<><MessageSquare className="mr-2 h-4 w-4" /> Message Giver</>);
                button.className = 'w-full inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90';
                
                // The button now calls your existing handleMessageClick function
                button.onclick = () => handleMessageClick(item.giver_id);
                
                container.appendChild(button);
              }
            }
          });
        }
      });
    }
  }, [data, userRole, currentUserId, handleMessageClick]); // Added dependencies
  // --- END OF MODIFIED SECTION ---

  const handleTabChange = (tab: string) => {
    if (tab === 'add') setShowAddDialog(true);
    else onTabChange(tab);
  };

  if (chatUser) {
    return (
      <ChatWindow
        otherUserId={chatUser.id}
        otherUserName={chatUser.name}
        otherUserAvatar={chatUser.avatar}
        onBack={() => setChatUser(null)}
      />
    );
  }
  
  return (
    <div className="relative h-screen w-full flex">
      <div className="flex-1 relative">
        <div id="map" ref={mapContainerRef} style={{ height: '100vh', width: '100%' }} />
        {(locationLoading || dataLoading) && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white rounded-full shadow-lg p-2 flex items-center z-[1000]">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">{locationLoading ? "Finding location..." : "Loading data..."}</span>
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

      {userRole === 'food_giver' && (
        <AddFoodDialog open={showAddDialog} onOpenChange={setShowAddDialog} onSuccess={() => { refetch(); setShowAddDialog(false); }}/>
      )}
    </div>
  );
};

export default MapView;
