import { useState, useEffect } from 'react';
import { watchPosition, clearWatch, getCurrentPosition } from '@/utils/geolocation';
import type { LocationCoords } from '@/utils/geolocation';

export const useUserLocation = () => {
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      setLoading(false);
      return;
    }

    // Try to get current position first
    getCurrentPosition()
      .then((coords) => {
        setLocation(coords);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error getting current position:', err);
        setError(err.message);
        setLoading(false);
        if (err.code === 1) { // PERMISSION_DENIED
          setPermissionDenied(true);
        }
      });

    // Set up continuous watching
    const watchId = watchPosition(
      (coords) => {
        setLocation(coords);
        setError(null);
        setPermissionDenied(false);
        if (loading) setLoading(false);
      },
      (err) => {
        console.error('Location watch error:', err);
        setError(err.message);
        if (err.code === 1) { // PERMISSION_DENIED
          setPermissionDenied(true);
        }
        if (loading) setLoading(false);
      }
    );

    return () => {
      clearWatch(watchId);
    };
  }, []);

  const recenter = async () => {
    setLoading(true);
    try {
      const coords = await getCurrentPosition();
      setLocation(coords);
      setError(null);
      setPermissionDenied(false);
    } catch (err: any) {
      setError(err.message);
      if (err.code === 1) {
        setPermissionDenied(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return { location, error, loading, permissionDenied, recenter };
};
