import { getDistance } from 'geolib';

export const calculateDistance = (
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): number => {
  return getDistance(
    { latitude: from.lat, longitude: from.lng },
    { latitude: to.lat, longitude: to.lng }
  );
};

export const formatDistance = (meters: number): string => {
  if (meters < 100) return `${Math.round(meters)}m away`;
  if (meters < 1000) return `${Math.round(meters)}m away`;
  if (meters < 10000) return `${(meters / 1000).toFixed(1)} km away`;
  return `${Math.round(meters / 1000)} km away`;
};

export const sortByDistance = <T extends { latitude?: number | null; longitude?: number | null; [key: string]: any }>(
  items: T[],
  userLocation: { lat: number; lng: number }
): T[] => {
  if (!Array.isArray(items)) return [];

  return [...items].sort((a, b) => {
    if (!a.latitude || !a.longitude) return 1;
    if (!b.latitude || !b.longitude) return -1;

    const distanceA = calculateDistance(userLocation, {
      lat: a.latitude,
      lng: a.longitude
    });
    const distanceB = calculateDistance(userLocation, {
      lat: b.latitude,
      lng: b.longitude
    });
    return distanceA - distanceB;
  });
};

export const filterByDistance = <T extends { latitude?: number | null; longitude?: number | null; [key: string]: any }>(
  items: T[],
  userLocation: { lat: number; lng: number },
  radiusKm: number
): T[] => {
  if (!Array.isArray(items)) return [];

  return items.filter(item => {
    if (!item.latitude || !item.longitude) return false;

    const distance = calculateDistance(userLocation, {
      lat: item.latitude,
      lng: item.longitude
    });
    return distance <= radiusKm * 1000; // Convert km to meters
  });
};
