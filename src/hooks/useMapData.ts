import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { LocationCoords } from '@/utils/geolocation';

export type MapDataItem = {
  id: string; latitude: number; longitude: number; [key: string]: any;
};

export const useMapData = (
  userRole: 'food_giver' | 'food_receiver',
  userLocation: LocationCoords | null
) => {
  const [data, setData] = useState<MapDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const refetch = async () => {
    if (!userLocation) { setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      if (userRole === 'food_receiver') {
        // --- THIS IS THE FIX: Restoring the correct, explicit query ---
        const { data: listings, error: fetchError } = await supabase.from('food_listings')
          .select(`*, giver:profiles!giver_id (id, full_name, profile_picture_url, organization_name)`)
          .eq('is_available', true).not('latitude', 'is', null).not('longitude', 'is', null)
          .order('created_at', { ascending: false });
        if (fetchError) throw fetchError;
        setData(Array.isArray(listings) ? listings : []);
      } else {
        // --- THIS IS THE FIX: Restoring the correct, explicit query ---
        const { data: requests, error: fetchError } = await supabase.from('food_requests')
          .select(`*, receiver:profiles!receiver_id (id, full_name, profile_picture_url, organization_name)`)
          .eq('status', 'active').not('latitude', 'is', null).not('longitude', 'is', null)
          .order('created_at', { ascending: false });
        if (fetchError) throw fetchError;
        setData(Array.isArray(requests) ? requests : []);
      }
    } catch (err) { setError(err); } finally { setLoading(false); }
  };

  useEffect(() => {
    refetch();
  }, [userRole, userLocation?.lat, userLocation?.lng]);

  return { data, loading, error, refetch };
};
