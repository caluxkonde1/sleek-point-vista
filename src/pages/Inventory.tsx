import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Minus, Package, TrendingUp, TrendingDown, History, Search } from "lucide-react";
import { format } from "date-fns";

interface Product {
  id: string;
  name: string;
  stock_quantity: number;
  cost_price: number;
  price: number;
}

interface StockMovement {
  id: string;
  type: string;
  quantity: number;
  reason: string | null;
  created_at: string;
  products: {
    name: string;
  };
}

const Inventory = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'in' as 'in' | 'out',
    quantity: '',
    reason: ''
  });

  useEffect(() => {
    loadProducts();
    loadStockMovements();
  }, []);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, stock_quantity, cost_price, price')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive"
      });
    }
  };

  const loadStockMovements = async () => {
    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .select('*, products(name)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setStockMovements(data || []);
    } catch (error) {
      console.error('Error loading stock movements:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !user) return;

    setLoading(true);

    try {
      const quantity = parseInt(formData.quantity);
      const adjustedQuantity = formData.type === 'out' ? -quantity : quantity;

      // Create stock movement record
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert([{
          product_id: selectedProduct.id,
          type: formData.type,
          quantity: quantity,
          reason: formData.reason || null,
          user_id: user.id
        }]);

      if (movementError) throw movementError;

      // Update product stock
      const { error: productError } = await supabase
        .from('products')
        .update({
          stock_quantity: selectedProduct.stock_quantity + adjustedQuantity
        })
        .eq('id', selectedProduct.id);

      if (productError) throw productError;

      toast({
        title: "Success",
        description: `Stock ${formData.type === 'in' ? 'added' : 'removed'} successfully`
      });

      resetForm();
      setIsDialogOpen(false);
      loadProducts();
      loadStockMovements();
    } catch (error) {
      console.error('Error updating stock:', error);
      toast({
        title: "Error",
        description: "Failed to update stock",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const openStockDialog = (product: Product, type: 'in' | 'out') => {
    setSelectedProduct(product);
    setFormData({
      type,
      quantity: '',
      reason: ''
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      type: 'in',
      quantity: '',
      reason: ''
    });
    setSelectedProduct(null);
  };

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStockStatus = (quantity: number) => {
    if (quantity <= 5) return { variant: 'destructive' as const, label: 'Low Stock' };
    if (quantity <= 20) return { variant: 'secondary' as const, label: 'Medium' };
    return { variant: 'default' as const, label: 'Good' };
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Inventory Management</h1>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Stock */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold">Product Stock Levels</h2>
          <div className="space-y-3">
            {filteredProducts.map(product => {
              const stockStatus = getStockStatus(product.stock_quantity);
              
              return (
                <Card key={product.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium">{product.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Current Stock: {product.stock_quantity}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Value: Rp {(product.stock_quantity * product.cost_price).toLocaleString()}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Badge variant={stockStatus.variant}>
                          {stockStatus.label}
                        </Badge>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openStockDialog(product, 'in')}
                            className="text-green-600 hover:text-green-600"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openStockDialog(product, 'out')}
                            className="text-red-600 hover:text-red-600"
                            disabled={product.stock_quantity === 0}
                          >
                            <Minus className="w-3 h-3 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Stock Movement History */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <History className="w-5 h-5" />
            Recent Movements
          </h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {stockMovements.map(movement => (
              <Card key={movement.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{movement.products.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(movement.created_at), 'dd/MM HH:mm')}
                    </p>
                    {movement.reason && (
                      <p className="text-xs text-muted-foreground">{movement.reason}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      {movement.type === 'in' ? (
                        <TrendingUp className="w-3 h-3 text-green-600" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-red-600" />
                      )}
                      <span className={`text-sm font-medium ${
                        movement.type === 'in' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {movement.type === 'in' ? '+' : '-'}{movement.quantity}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Stock Adjustment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {formData.type === 'in' ? 'Add Stock' : 'Remove Stock'}
            </DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Product</Label>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">{selectedProduct.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Current Stock: {selectedProduct.stock_quantity}
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max={formData.type === 'out' ? selectedProduct.stock_quantity : undefined}
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  required
                />
              </div>

              <div>
                <Label htmlFor="reason">Reason</Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  placeholder="Enter reason for stock adjustment"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className={formData.type === 'in' ? '' : 'bg-red-600 hover:bg-red-700'}
                >
                  {loading ? 'Processing...' : `${formData.type === 'in' ? 'Add' : 'Remove'} Stock`}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">No Products Found</h2>
          <p className="text-muted-foreground">Add products first to manage inventory</p>
        </div>
      )}
    </div>
  );
};

export default Inventory;