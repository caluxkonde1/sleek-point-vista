-- Create comprehensive POS database schema

-- Create enum types for the application
CREATE TYPE public.user_role AS ENUM ('superadmin', 'admin', 'manager', 'cashier', 'staff');
CREATE TYPE public.subscription_plan AS ENUM ('free', 'pro', 'pro_plus');
CREATE TYPE public.payment_method AS ENUM ('cash', 'card', 'e_wallet', 'qris', 'bank_transfer');
CREATE TYPE public.transaction_status AS ENUM ('pending', 'completed', 'cancelled', 'refunded');

-- Outlets table (multi-store support)
CREATE TABLE public.outlets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  owner_id UUID NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enhanced profiles table for user management
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  role public.user_role NOT NULL DEFAULT 'staff',
  subscription_plan public.subscription_plan NOT NULL DEFAULT 'free',
  outlet_id UUID REFERENCES public.outlets(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Product categories
CREATE TABLE public.product_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  outlet_id UUID NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  cost_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER DEFAULT 5,
  image_url TEXT,
  category_id UUID REFERENCES public.product_categories(id),
  outlet_id UUID NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_number TEXT NOT NULL UNIQUE,
  outlet_id UUID NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
  cashier_id UUID NOT NULL,
  customer_name TEXT,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  final_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method public.payment_method,
  status public.transaction_status NOT NULL DEFAULT 'completed',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Transaction items
CREATE TABLE public.transaction_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

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

-- Enable Row Level Security
ALTER TABLE public.outlets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for outlets
CREATE POLICY "Owners can manage their outlets" ON public.outlets
  FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "Users can view their outlet data" ON public.outlets
  FOR SELECT USING (
    owner_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND outlet_id = outlets.id
    )
  );

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Superadmin can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles AS p
      WHERE p.user_id = auth.uid() AND p.role IN ('superadmin', 'admin')
    )
  );

CREATE POLICY "Superadmin can update all profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles AS p
      WHERE p.user_id = auth.uid() AND p.role IN ('superadmin', 'admin')
    )
  );

CREATE POLICY "Superadmin can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles AS p
      WHERE p.user_id = auth.uid() AND p.role IN ('superadmin', 'admin')
    )
  );

-- RLS Policies for products
CREATE POLICY "Users can view outlet products" ON public.products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.outlets 
      WHERE id = products.outlet_id AND (
        owner_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE user_id = auth.uid() AND outlet_id = products.outlet_id
        )
      )
    )
  );

CREATE POLICY "Users can manage outlet products" ON public.products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.outlets 
      WHERE id = products.outlet_id AND (
        owner_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE user_id = auth.uid() AND outlet_id = products.outlet_id 
          AND role IN ('admin', 'manager')
        )
      )
    )
  );

-- RLS Policies for transactions
CREATE POLICY "Users can view outlet transactions" ON public.transactions
  FOR SELECT USING (
    cashier_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.outlets 
      WHERE id = transactions.outlet_id AND (
        owner_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE user_id = auth.uid() AND outlet_id = transactions.outlet_id
        )
      )
    )
  );

CREATE POLICY "Cashiers can create transactions" ON public.transactions
  FOR INSERT WITH CHECK (
    cashier_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND outlet_id = transactions.outlet_id
    )
  );

-- Similar policies for other tables
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

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_outlets_updated_at
  BEFORE UPDATE ON public.outlets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role, subscription_plan)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    CASE 
      WHEN NEW.email = 'laporsiappak@gmail.com' THEN 'superadmin'::public.user_role
      ELSE 'staff'::public.user_role
    END,
    'free'::public.subscription_plan
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

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