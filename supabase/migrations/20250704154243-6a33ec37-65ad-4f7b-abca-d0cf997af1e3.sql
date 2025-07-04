-- Fix the handle_new_user function with explicit schema references
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