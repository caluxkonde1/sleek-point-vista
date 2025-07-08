-- Drop the problematic policy and create a simpler one
DROP POLICY IF EXISTS "Admin access to all profiles" ON public.profiles;

-- Create a security definer function that bypasses RLS
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role 
  FROM public.profiles 
  WHERE user_id = auth.uid();
  
  RETURN COALESCE(user_role IN ('superadmin', 'admin'), false);
END;
$$;

-- Create simple policies
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.is_admin_user());

CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (public.is_admin_user());

CREATE POLICY "Admins can insert profiles"
ON public.profiles
FOR INSERT
WITH CHECK (public.is_admin_user());