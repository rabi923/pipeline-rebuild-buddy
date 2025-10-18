import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// This is a minimal MapView that uses the original Leaflet library
// It has NO dependency on the broken react-leaflet wrapper.
const MapView = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // We use a ref to prevent the map from re-initializing on every render
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    // Check if the container is available and the map hasn't been created yet
    if (mapContainerRef.current && !mapInstanceRef.current) {
      // Create a new map instance
      const map = L.map(mapContainerRef.current, {
        center: [51.505, -0.09],
        zoom: 13,
      });

      // Add the tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      // Add a simple marker
      L.marker([51.505, -0.09]).addTo(map).bindPopup('A simple marker.');

      // Save the map instance to the ref
      mapInstanceRef.current = map;
    }
  }, []); // Empty dependency array ensures this runs only once

  return (
    <div 
      ref={mapContainerRef} 
      style={{ height: '100%', width: '100%' }} 
    />
  );
};

export default MapView;
