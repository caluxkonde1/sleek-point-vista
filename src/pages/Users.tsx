import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Edit, UserCheck, UserX, Search } from "lucide-react";

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  is_active: boolean;
  outlet_id: string | null;
  created_at: string;
  outlets?: {
    name: string;
  } | null;
}

interface Outlet {
  id: string;
  name: string;
}

const Users = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<Profile[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    role: 'staff' as const,
    outlet_id: '',
    is_active: true
  });

  useEffect(() => {
    loadUsers();
    loadOutlets();
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

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
        .eq('id', editingUser.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User updated successfully"
      });

      resetForm();
      setIsDialogOpen(false);
      loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (userProfile: Profile) => {
    setEditingUser(userProfile);
    setFormData({
      full_name: userProfile.full_name || '',
      phone: userProfile.phone || '',
      role: userProfile.role as any,
      outlet_id: userProfile.outlet_id || '',
      is_active: userProfile.is_active
    });
    setIsDialogOpen(true);
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

  const resetForm = () => {
    setFormData({
      full_name: '',
      phone: '',
      role: 'staff',
      outlet_id: '',
      is_active: true
    });
    setEditingUser(null);
  };

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.phone?.includes(searchQuery) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'destructive';
      case 'admin':
        return 'default';
      case 'manager':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  // Check if current user can manage other users
  const canManageUsers = profile?.role === 'superadmin' || profile?.role === 'admin';

  if (!canManageUsers) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="text-center py-8">
            <UserX className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You don't have permission to manage users.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">User Management</h1>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map(userProfile => (
          <Card key={userProfile.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {userProfile.full_name || 'Unnamed User'}
                </CardTitle>
                <Badge variant={getRoleBadgeVariant(userProfile.role)}>
                  {userProfile.role}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {userProfile.phone && (
                <p className="text-sm text-muted-foreground">
                  Phone: {userProfile.phone}
                </p>
              )}
              
              {userProfile.outlets && (
                <p className="text-sm text-muted-foreground">
                  Outlet: {userProfile.outlets.name}
                </p>
              )}

              <div className="flex items-center gap-2">
                <span className="text-sm">Status:</span>
                <Badge variant={userProfile.is_active ? "default" : "secondary"}>
                  {userProfile.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>

              <div className="flex gap-2 pt-2">
                <Dialog open={isDialogOpen && editingUser?.id === userProfile.id} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(userProfile)}
                      className="flex-1"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Edit User</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="full_name">Full Name</Label>
                        <Input
                          id="full_name"
                          value={formData.full_name}
                          onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        />
                      </div>

                      <div>
                        <Label htmlFor="role">Role</Label>
                        <Select value={formData.role} onValueChange={(value: any) => setFormData({...formData, role: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="staff">Staff</SelectItem>
                            <SelectItem value="cashier">Cashier</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            {profile?.role === 'superadmin' && (
                              <SelectItem value="admin">Admin</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="outlet_id">Outlet</Label>
                        <Select value={formData.outlet_id} onValueChange={(value) => setFormData({...formData, outlet_id: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select outlet" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">No Outlet</SelectItem>
                            {outlets.map(outlet => (
                              <SelectItem key={outlet.id} value={outlet.id}>
                                {outlet.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="is_active"
                          checked={formData.is_active}
                          onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                        />
                        <Label htmlFor="is_active">Active</Label>
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                          {loading ? 'Updating...' : 'Update'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleUserStatus(userProfile.id, userProfile.is_active)}
                  className={userProfile.is_active ? "text-destructive hover:text-destructive" : "text-green-600 hover:text-green-600"}
                >
                  {userProfile.is_active ? <UserX className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No users found</p>
        </div>
      )}
    </div>
  );
};

export default Users;