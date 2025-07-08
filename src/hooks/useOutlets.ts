import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Outlet } from '@/types/user';

export const useOutlets = () => {
  const [outlets, setOutlets] = useState<Outlet[]>([]);

  const loadOutlets = async () => {
    try {
      const { data, error } = await supabase
        .from('outlets')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setOutlets(data || []);
    } catch (error) {
      console.error('Error loading outlets:', error);
    }
  };

  useEffect(() => {
    loadOutlets();
  }, []);

  return {
    outlets,
    loadOutlets
  };
};