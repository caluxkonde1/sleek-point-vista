-- Create comprehensive POS database schema (handling existing types)

-- Create enum types only if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
        CREATE TYPE public.payment_method AS ENUM ('cash', 'card', 'e_wallet', 'qris', 'bank_transfer');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_status') THEN
        CREATE TYPE public.transaction_status AS ENUM ('pending', 'completed', 'cancelled', 'refunded');
    END IF;
END $$;

-- Expenses tracking
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  outlet_id UUID NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  receipt_image_url TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Additional income tracking
CREATE TABLE public.incomes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  outlet_id UUID NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Stock movements tracking
CREATE TABLE public.stock_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'in', 'out', 'adjustment'
  quantity INTEGER NOT NULL,
  reason TEXT,
  reference_id UUID, -- transaction_id for sales, adjustment_id for manual adjustments
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Update existing transactions table to add new payment methods and status
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS payment_method public.payment_method,
ADD COLUMN IF NOT EXISTS status public.transaction_status DEFAULT 'completed',
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Enable Row Level Security on new tables
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for expenses
CREATE POLICY "Users can view outlet expenses" ON public.expenses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.outlets 
      WHERE id = expenses.outlet_id AND (
        owner_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE user_id = auth.uid() AND outlet_id = expenses.outlet_id
        )
      )
    )
  );

CREATE POLICY "Users can manage outlet expenses" ON public.expenses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.outlets 
      WHERE id = expenses.outlet_id AND (
        owner_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE user_id = auth.uid() AND outlet_id = expenses.outlet_id
        )
      )
    )
  );

-- RLS Policies for incomes
CREATE POLICY "Users can view outlet incomes" ON public.incomes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.outlets 
      WHERE id = incomes.outlet_id AND (
        owner_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE user_id = auth.uid() AND outlet_id = incomes.outlet_id
        )
      )
    )
  );

CREATE POLICY "Users can manage outlet incomes" ON public.incomes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.outlets 
      WHERE id = incomes.outlet_id AND (
        owner_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE user_id = auth.uid() AND outlet_id = incomes.outlet_id
        )
      )
    )
  );

-- RLS Policies for stock movements
CREATE POLICY "Users can view outlet stock movements" ON public.stock_movements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.outlets o ON p.outlet_id = o.id
      WHERE p.id = stock_movements.product_id AND (
        o.owner_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE user_id = auth.uid() AND outlet_id = o.id
        )
      )
    )
  );

CREATE POLICY "Users can manage outlet stock movements" ON public.stock_movements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.outlets o ON p.outlet_id = o.id
      WHERE p.id = stock_movements.product_id AND (
        o.owner_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE user_id = auth.uid() AND outlet_id = o.id
        )
      )
    )
  );

-- Add updated_at triggers for new tables
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_incomes_updated_at
  BEFORE UPDATE ON public.incomes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update stock when transaction is created
CREATE OR REPLACE FUNCTION public.update_stock_on_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update product stock
  UPDATE public.products 
  SET stock_quantity = stock_quantity - NEW.quantity
  WHERE id = NEW.product_id;
  
  -- Log stock movement
  INSERT INTO public.stock_movements (
    product_id, type, quantity, reason, reference_id, user_id
  ) VALUES (
    NEW.product_id, 'out', NEW.quantity, 'Sale', NEW.transaction_id, 
    (SELECT cashier_id FROM public.transactions WHERE id = NEW.transaction_id)
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_stock_on_transaction_item
  AFTER INSERT ON public.transaction_items
  FOR EACH ROW EXECUTE FUNCTION public.update_stock_on_transaction();

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for product images
CREATE POLICY "Product images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'product-images');

CREATE POLICY "Users can upload product images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'product-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update product images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'product-images' AND auth.uid() IS NOT NULL);

-- Create storage bucket for receipts
INSERT INTO storage.buckets (id, name, public) 
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for receipts
CREATE POLICY "Users can access their outlet receipts" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'receipts' AND 
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can upload receipts" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'receipts' AND auth.uid() IS NOT NULL);