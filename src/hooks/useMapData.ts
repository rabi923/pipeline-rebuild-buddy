import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { LocationCoords } from '@/utils/geolocation';

// Your existing type definition
export type MapDataItem = {   
  id: string;
  latitude: number;
  longitude: number;
  [key: string]: any;
};

// This hook is now rewritten to use useState/useEffect, just like useConversations
export const useMapData = (
  userRole: 'food_giver' | 'food_receiver',
  userLocation: LocationCoords | null
) => {
  const [data, setData] = useState<MapDataItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    // Don't fetch if we don't have a location yet
    if (!userLocation) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        if (userRole === 'food_receiver') {
          // Receivers see all available food listings from all givers
          const { data: listings, error: fetchError } = await supabase
            .from('food_listings')
            .select(`*, giver:profiles!giver_id (id, full_name, profile_picture_url, organization_name)`)
            .eq('is_available', true)
            .not('latitude', 'is', null)
            .not('longitude', 'is', null)
            .order('created_at', { ascending: false });

          if (fetchError) throw fetchError;
          setData(Array.isArray(listings) ? listings : []);

        } else {
          // Givers see all active food requests from receivers
          const { data: requests, error: fetchError } = await supabase
            .from('food_requests')
            .select(`*, receiver:profiles!receiver_id (id, full_name, profile_picture_url, organization_name)`)
            .eq('status', 'active')
            .not('latitude', 'is', null)
            .not('longitude', 'is', null)
            .order('created_at', { ascending: false });

          if (fetchError) throw fetchError;
          setData(Array.isArray(requests) ? requests : []);
        }
      } catch (err) {
        console.error('Unexpected error in useMapData:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();

  }, [userRole, userLocation?.lat, userLocation?.lng]); // Refetch when role or location changes

  // You would typically have a refetch function if you wanted to pull-to-refresh
  const refetch = () => {}; 

  return {
    data: data || [],
    loading: isLoading,
    error,
    refetch,
  };
};
