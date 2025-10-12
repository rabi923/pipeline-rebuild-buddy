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
          const { data: requests, error } = await supabase
            .from('food_requests')
            .select(`
              *,
              receiver:profiles!receiver_id (
                id,
                full_name,
                phone,
                profile_picture_url,
                organization_name
              )
            `)
            .eq('status', 'active')
            .gte('needed_by', new Date().toISOString())
            .order('urgency_level', { ascending: false });

          if (error) {
            console.error('Error fetching food requests:', error);
            return [];
          }

          return Array.isArray(requests) ? requests : [];
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
