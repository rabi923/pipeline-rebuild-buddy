import { useState, useEffect, useCallback } from 'react'; // Correctly import useCallback
import { watchPosition, clearWatch, getCurrentPosition } from '@/utils/geolocation';
import type { LocationCoords } from '@/utils/geolocation';

export const useUserLocation = () => {
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // We define a stable function to get the current location.
  const fetchCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      setLoading(false);
      return;
    }
    setLoading(true);
    getCurrentPosition()
      .then((coords) => {
        setLocation(coords);
        setError(null);
        setPermissionDenied(false);
      })
      .catch((err) => {
        setError(err.message);
        if (err.code === 1) setPermissionDenied(true);
      })
      .finally(() => setLoading(false));
  }, []); // Empty dependency array means this function is created only once.

  // This is the main effect that runs when the hook is used.
  useEffect(() => {
    // --- THIS IS THE KEY ---
    // We call fetchCurrentLocation() EVERY time the component that uses this hook mounts.
    // This ensures that when you come back to the map, a fresh location fetch is triggered.
    fetchCurrentLocation();

    // The continuous watching can still run in the background for live updates.
    const watchId = watchPosition(
      (coords) => setLocation(coords),
      (err) => {
        if (err.code === 1) setPermissionDenied(true);
      }
    );

    // Clean up the watcher when the component unmounts.
    return () => {
      clearWatch(watchId);
    };
    // We depend on `fetchCurrentLocation` to ensure this runs correctly.
  }, [fetchCurrentLocation]);

  // The 'recenter' function is now an alias for our main fetch function.
  return { location, error, loading, permissionDenied, recenter: fetchCurrentLocation };
};
