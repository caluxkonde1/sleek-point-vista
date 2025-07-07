import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  X, 
  Search, 
  CreditCard, 
  Banknote,
  Smartphone,
  QrCode,
  Calculator,
  Receipt,
  Trash2
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  image_url?: string;
  category: string;
  cost_price?: number;
  min_stock?: number;
  is_active?: boolean;
}

interface CartItem extends Product {
  quantity: number;
  total: number;
}

const POS = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [customerName, setCustomerName] = useState('');
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load products and categories
  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, product_categories(name)')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      const formattedProducts = data?.map(product => ({
        id: product.id,
        name: product.name,
        price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
        stock_quantity: product.stock_quantity,
        image_url: product.image_url || undefined,
        category: product.product_categories?.name || 'Uncategorized',
        cost_price: typeof product.cost_price === 'string' ? parseFloat(product.cost_price) : product.cost_price,
        min_stock: (product as any).min_stock ?? 5,
        is_active: product.is_active
      })) || [];

      setProducts(formattedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive"
      });
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('name')
        .order('name');

      if (error) throw error;

      const categoryNames = data?.map(cat => cat.name) || [];
      setCategories(['all', ...categoryNames]);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const addToCart = (product: Product) => {
    if (product.stock_quantity <= 0) {
      toast({
        title: "Out of Stock",
        description: `${product.name} is out of stock`,
        variant: "destructive"
      });
      return;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      
      if (existingItem) {
        if (existingItem.quantity >= product.stock_quantity) {
          toast({
            title: "Stock Limit",
            description: `Only ${product.stock_quantity} items available`,
            variant: "destructive"
          });
          return prevCart;
        }
        
        return prevCart.map(item =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                total: (item.quantity + 1) * item.price
              }
            : item
        );
      } else {
        return [...prevCart, {
          ...product,
          quantity: 1,
          total: product.price
        }];
      }
    });
  };

  const updateCartQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(id);
      return;
    }

    const product = products.find(p => p.id === id);
    if (product && newQuantity > product.stock_quantity) {
      toast({
        title: "Stock Limit",
        description: `Only ${product.stock_quantity} items available`,
        variant: "destructive"
      });
      return;
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.id === id
          ? { ...item, quantity: newQuantity, total: newQuantity * item.price }
          : item
      )
    );
  };

  const removeFromCart = (id: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    setCustomerName('');
    setDiscount(0);
    setTax(0);
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  };

  const getFinalTotal = () => {
    const subtotal = getCartTotal();
    const discountAmount = (subtotal * discount) / 100;
    const taxAmount = ((subtotal - discountAmount) * tax) / 100;
    return subtotal - discountAmount + taxAmount;
  };

  const processPayment = async () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Add items to cart before processing payment",
        variant: "destructive"
      });
      return;
    }

    if (!user || !profile?.outlet_id) {
      toast({
        title: "Error",
        description: "User not authenticated or no outlet assigned",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Generate transaction number
      const transactionNumber = `TXN-${Date.now()}`;
      
      // Create transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          transaction_number: transactionNumber,
          outlet_id: profile.outlet_id,
          cashier_id: user.id,
          customer_name: customerName || null,
          total_amount: getCartTotal(),
          discount_amount: (getCartTotal() * discount) / 100,
          tax_amount: ((getCartTotal() - (getCartTotal() * discount) / 100) * tax) / 100,
          final_amount: getFinalTotal(),
          payment_method: paymentMethod as any,
          status: 'completed'
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Create transaction items
      const transactionItems = cart.map(item => ({
        transaction_id: transaction.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
        total: item.total
      }));

      const { error: itemsError } = await supabase
        .from('transaction_items')
        .insert(transactionItems);

      if (itemsError) throw itemsError;

      toast({
        title: "Transaction Completed",
        description: `Transaction ${transactionNumber} completed successfully`,
        variant: "default"
      });

      // Clear cart and close dialog
      clearCart();
      setIsPaymentDialogOpen(false);
      
      // Navigate to receipt page
      navigate(`/receipt/${transaction.id}`);
      
      // Reload products to update stock
      loadProducts();

    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: "Transaction Failed",
        description: "Failed to process payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products
    .filter(product => 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (selectedCategory === 'all' || product.category === selectedCategory)
    );

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Products Section */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-card">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Products Grid */}
        <ScrollArea className="flex-1 p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map(product => (
              <Card
                key={product.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => addToCart(product)}
              >
                <CardContent className="p-3">
                  <div className="aspect-square bg-muted rounded-lg mb-2 flex items-center justify-center">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <span className="text-muted-foreground text-sm">No Image</span>
                    )}
                  </div>
                  <h3 className="font-medium text-sm mb-1 line-clamp-2">{product.name}</h3>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary">
                      Rp {product.price.toLocaleString()}
                    </span>
                    <Badge variant={product.stock_quantity > 0 ? "secondary" : "destructive"}>
                      {product.stock_quantity}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Cart Section */}
      <div className="w-96 border-l bg-card flex flex-col">
        {/* Cart Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Cart ({cart.length})
            </h2>
            {cart.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearCart}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Cart Items */}
        <ScrollArea className="flex-1 p-4">
          {cart.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Cart is empty</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{item.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      Rp {item.price.toLocaleString()} each
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 p-0"
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 p-0"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">Rp {item.total.toLocaleString()}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromCart(item.id)}
                      className="w-6 h-6 p-0 text-destructive hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Cart Summary */}
        {cart.length > 0 && (
          <div className="p-4 border-t space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>Rp {getCartTotal().toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-destructive">
                  <span>Discount ({discount}%):</span>
                  <span>-Rp {((getCartTotal() * discount) / 100).toLocaleString()}</span>
                </div>
              )}
              {tax > 0 && (
                <div className="flex justify-between">
                  <span>Tax ({tax}%):</span>
                  <span>Rp {(((getCartTotal() - (getCartTotal() * discount) / 100) * tax) / 100).toLocaleString()}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-medium text-lg">
                <span>Total:</span>
                <span className="text-primary">Rp {getFinalTotal().toLocaleString()}</span>
              </div>
            </div>

            <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full pos-button-orange" size="lg">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Process Payment
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Payment Details</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Customer Name (Optional)</label>
                    <Input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Enter customer name"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Payment Method</label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">
                          <div className="flex items-center gap-2">
                            <Banknote className="w-4 h-4" />
                            Cash
                          </div>
                        </SelectItem>
                        <SelectItem value="card">
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4" />
                            Card
                          </div>
                        </SelectItem>
                        <SelectItem value="e_wallet">
                          <div className="flex items-center gap-2">
                            <Smartphone className="w-4 h-4" />
                            E-Wallet
                          </div>
                        </SelectItem>
                        <SelectItem value="qris">
                          <div className="flex items-center gap-2">
                            <QrCode className="w-4 h-4" />
                            QRIS
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-sm font-medium">Discount (%)</label>
                      <Input
                        type="number"
                        value={discount}
                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                        min="0"
                        max="100"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Tax (%)</label>
                      <Input
                        type="number"
                        value={tax}
                        onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>

                  <div className="bg-muted p-3 rounded-lg">
                    <div className="flex justify-between font-medium text-lg">
                      <span>Total Amount:</span>
                      <span className="text-primary">Rp {getFinalTotal().toLocaleString()}</span>
                    </div>
                  </div>

                  <Button
                    onClick={processPayment}
                    disabled={loading}
                    className="w-full pos-button-orange"
                    size="lg"
                  >
                    {loading ? (
                      "Processing..."
                    ) : (
                      <>
                        <Receipt className="w-4 h-4 mr-2" />
                        Complete Payment
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </div>
  );
};

export default POS;