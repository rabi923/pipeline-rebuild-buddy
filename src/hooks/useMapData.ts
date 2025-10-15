import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { LocationCoords } from '@/utils/geolocation';

export type MapDataItem = {
  id: string;
  latitude: number;
  longitude: number;
  [key: string]: any;
};

export const useMapData = (
  userRole: 'food_giver' | 'food_receiver',
  userLocation: LocationCoords | null
) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['mapData', userRole, userLocation?.lat, userLocation?.lng],
    queryFn: async () => {
      if (!userLocation) {
        return [];
      }

      try {
        if (userRole === 'food_receiver') {
          // Receivers see all available food listings from all givers
          const { data: listings, error } = await supabase
            .from('food_listings')
            .select(`
              *,
              giver:profiles!giver_id (
                id,
                full_name,
                phone,
                profile_picture_url,
                organization_name
              )
            `)
            .eq('is_available', true)
            .not('latitude', 'is', null)
            .not('longitude', 'is', null)
            .order('created_at', { ascending: false });

          if (error) {
            console.error('Error fetching food listings:', error);
            return [];
          }

          return Array.isArray(listings) ? listings : [];
        } else {
          // Givers see their own food listings
          const { data: { user } } = await supabase.auth.getUser();
          
          if (!user) {
            console.error('No authenticated user found');
            return [];
          }

          const { data: listings, error } = await supabase
            .from('food_listings')
            .select(`
              *,
              giver:profiles!giver_id (
                id,
                full_name,
                phone,
                profile_picture_url,
                organization_name
              )
            `)
            .eq('giver_id', user.id)
            .not('latitude', 'is', null)
            .not('longitude', 'is', null)
            .order('created_at', { ascending: false });

          if (error) {
            console.error('Error fetching giver listings:', error);
            return [];
          }

          return Array.isArray(listings) ? listings : [];
        }
      } catch (err) {
        console.error('Unexpected error in useMapData:', err);
        return [];
      }
    },
    enabled: !!userLocation,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });

  return {
    data: data || [],
    loading: isLoading,
    error,
    refetch,
  };
};
