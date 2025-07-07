import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Edit, Tag, Trash2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  outlet_id: string;
  created_at: string;
}

const Settings = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: ''
  });
  const [outletData, setOutletData] = useState({
    name: '',
    address: '',
    phone: ''
  });

  useEffect(() => {
    loadCategories();
    loadOutletData();
  }, []);

  const loadCategories = async () => {
    if (!profile?.outlet_id) return;

    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('outlet_id', profile.outlet_id)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive"
      });
    }
  };

  const loadOutletData = async () => {
    if (!profile?.outlet_id) return;

    try {
      const { data, error } = await supabase
        .from('outlets')
        .select('name, address, phone')
        .eq('id', profile.outlet_id)
        .single();

      if (error) throw error;
      if (data) {
        setOutletData({
          name: data.name || '',
          address: data.address || '',
          phone: data.phone || ''
        });
      }
    } catch (error) {
      console.error('Error loading outlet data:', error);
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.outlet_id) return;

    setLoading(true);

    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('product_categories')
          .update({ name: formData.name })
          .eq('id', editingCategory.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Category updated successfully"
        });
      } else {
        const { error } = await supabase
          .from('product_categories')
          .insert([{
            name: formData.name,
            outlet_id: profile.outlet_id
          }]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Category created successfully"
        });
      }

      resetCategoryForm();
      setIsDialogOpen(false);
      loadCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      toast({
        title: "Error",
        description: "Failed to save category",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({ name: category.name });
    setIsDialogOpen(true);
  };

  const handleCategoryDelete = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const { error } = await supabase
        .from('product_categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Category deleted successfully"
      });

      loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive"
      });
    }
  };

  const resetCategoryForm = () => {
    setFormData({ name: '' });
    setEditingCategory(null);
  };

  const handleOutletUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.outlet_id) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('outlets')
        .update({
          name: outletData.name,
          address: outletData.address || null,
          phone: outletData.phone || null
        })
        .eq('id', profile.outlet_id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Outlet information updated successfully"
      });
    } catch (error) {
      console.error('Error updating outlet:', error);
      toast({
        title: "Error",
        description: "Failed to update outlet information",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Outlet Information */}
        <Card>
          <CardHeader>
            <CardTitle>Outlet Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleOutletUpdate} className="space-y-4">
              <div>
                <Label htmlFor="outlet_name">Outlet Name</Label>
                <Input
                  id="outlet_name"
                  value={outletData.name}
                  onChange={(e) => setOutletData({...outletData, name: e.target.value})}
                  required
                />
              </div>

              <div>
                <Label htmlFor="outlet_address">Address</Label>
                <Textarea
                  id="outlet_address"
                  value={outletData.address}
                  onChange={(e) => setOutletData({...outletData, address: e.target.value})}
                  placeholder="Enter outlet address"
                />
              </div>

              <div>
                <Label htmlFor="outlet_phone">Phone Number</Label>
                <Input
                  id="outlet_phone"
                  value={outletData.phone}
                  onChange={(e) => setOutletData({...outletData, phone: e.target.value})}
                  placeholder="Enter phone number"
                />
              </div>

              <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Outlet'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Product Categories */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Product Categories</CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetCategoryForm} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingCategory ? 'Edit Category' : 'Add New Category'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCategorySubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="category_name">Category Name</Label>
                      <Input
                        id="category_name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={loading}>
                        {loading ? 'Saving...' : (editingCategory ? 'Update' : 'Create')}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categories.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No categories created yet
                </p>
              ) : (
                categories.map(category => (
                  <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCategoryEdit(category)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCategoryDelete(category.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;