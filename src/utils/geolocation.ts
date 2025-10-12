export interface LocationCoords {
  lat: number;
  lng: number;
}

export const requestLocationPermission = async (): Promise<PermissionState> => {
  if (!navigator.permissions) {
    throw new Error('Permissions API not supported');
  }

  const result = await navigator.permissions.query({ name: 'geolocation' });
  return result.state;
};

export const getCurrentPosition = (): Promise<LocationCoords> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
};

export const watchPosition = (
  onSuccess: (coords: LocationCoords) => void,
  onError?: (error: GeolocationPositionError) => void
): number => {
  if (!navigator.geolocation) {
    throw new Error('Geolocation not supported');
  }

  return navigator.geolocation.watchPosition(
    (position) => {
      onSuccess({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });
    },
    onError,
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
};

export const clearWatch = (watchId: number): void => {
  navigator.geolocation.clearWatch(watchId);
};
