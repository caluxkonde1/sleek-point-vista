
-- First, let's make sure the enums exist
DO $$ 
BEGIN
    -- Create user_role enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('superadmin', 'admin', 'manager', 'cashier', 'staff');
    END IF;
    
    -- Create subscription_plan enum if it doesn't exist  
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_plan') THEN
        CREATE TYPE public.subscription_plan AS ENUM ('free', 'pro', 'pro_plus');
    END IF;
END $$;

-- Update the handle_new_user function to fix the casting issue
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
      WHEN NEW.email = 'laporsiappak@gmail.com' THEN 'superadmin'::user_role
      ELSE 'staff'::user_role
    END,
    'free'::subscription_plan
  );
  RETURN NEW;
END;
$$;

-- Make sure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
