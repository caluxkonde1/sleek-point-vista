import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Profile, UserFormData } from '@/types/user';

export const useUsers = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Get outlet names for users with outlet_id
      const usersWithOutlets = await Promise.all(
        (data || []).map(async (user) => {
          if (user.outlet_id) {
            const { data: outlet } = await supabase
              .from('outlets')
              .select('name')
              .eq('id', user.outlet_id)
              .single();
            return { ...user, outlets: outlet };
          }
          return { ...user, outlets: null };
        })
      );
      
      setUsers(usersWithOutlets);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
    }
  };

  const updateUser = async (userId: string, formData: UserFormData) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name || null,
          phone: formData.phone || null,
          role: formData.role,
          outlet_id: formData.outlet_id || null,
          is_active: formData.is_active
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User updated successfully"
      });

      loadUsers();
      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `User ${!currentStatus ? 'activated' : 'deactivated'} successfully`
      });

      loadUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return {
    users,
    loading,
    loadUsers,
    updateUser,
    toggleUserStatus
  };
};