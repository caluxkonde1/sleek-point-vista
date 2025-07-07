import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Edit, Store, MapPin, Phone, Users } from "lucide-react";

interface Outlet {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  is_active: boolean;
  owner_id: string;
  created_at: string;
  _count?: {
    profiles: number;
  };
}

const Outlets = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    is_active: true
  });

  useEffect(() => {
    loadOutlets();
  }, []);

  const loadOutlets = async () => {
    try {
      let query = supabase
        .from('outlets')
        .select('*')
        .order('created_at', { ascending: false });

      // Non-superadmin users can only see their own outlets
      if (profile?.role !== 'superadmin') {
        query = query.eq('owner_id', user?.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setOutlets(data || []);
    } catch (error) {
      console.error('Error loading outlets:', error);
      toast({
        title: "Error",
        description: "Failed to load outlets",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const outletData = {
        name: formData.name,
        address: formData.address || null,
        phone: formData.phone || null,
        is_active: formData.is_active,
        owner_id: user.id
      };

      if (editingOutlet) {
        const { error } = await supabase
          .from('outlets')
          .update(outletData)
          .eq('id', editingOutlet.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Outlet updated successfully"
        });
      } else {
        const { error } = await supabase
          .from('outlets')
          .insert([outletData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Outlet created successfully"
        });
      }

      resetForm();
      setIsDialogOpen(false);
      loadOutlets();
    } catch (error) {
      console.error('Error saving outlet:', error);
      toast({
        title: "Error",
        description: "Failed to save outlet",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (outlet: Outlet) => {
    setEditingOutlet(outlet);
    setFormData({
      name: outlet.name,
      address: outlet.address || '',
      phone: outlet.phone || '',
      is_active: outlet.is_active
    });
    setIsDialogOpen(true);
  };

  const toggleOutletStatus = async (outletId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('outlets')
        .update({ is_active: !currentStatus })
        .eq('id', outletId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Outlet ${!currentStatus ? 'activated' : 'deactivated'} successfully`
      });

      loadOutlets();
    } catch (error) {
      console.error('Error updating outlet status:', error);
      toast({
        title: "Error",
        description: "Failed to update outlet status",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      phone: '',
      is_active: true
    });
    setEditingOutlet(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Outlet Management</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Add Outlet
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingOutlet ? 'Edit Outlet' : 'Add New Outlet'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Outlet Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="Enter outlet address"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="Enter phone number"
                />
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
                  {loading ? 'Saving...' : (editingOutlet ? 'Update' : 'Create')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Outlets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {outlets.map(outlet => (
          <Card key={outlet.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Store className="w-5 h-5" />
                  {outlet.name}
                </CardTitle>
                <Badge variant={outlet.is_active ? "default" : "secondary"}>
                  {outlet.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {outlet.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-1 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{outlet.address}</p>
                </div>
              )}
              
              {outlet.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{outlet.phone}</p>
                </div>
              )}

              {outlet._count && (
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {outlet._count.profiles} staff members
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(outlet)}
                  className="flex-1"
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleOutletStatus(outlet.id, outlet.is_active)}
                  className={outlet.is_active ? "text-destructive hover:text-destructive" : "text-green-600 hover:text-green-600"}
                >
                  {outlet.is_active ? "Deactivate" : "Activate"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {outlets.length === 0 && (
        <div className="text-center py-12">
          <Store className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">No Outlets Found</h2>
          <p className="text-muted-foreground mb-4">Create your first outlet to get started</p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add First Outlet
          </Button>
        </div>
      )}
    </div>
  );
};

export default Outlets;