-- Fix infinite recursion in profiles table policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Superadmin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Superadmin can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Superadmin can insert profiles" ON public.profiles;

-- Create a security definer function to check user roles
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role::text
  FROM public.profiles
  WHERE user_id = _user_id
  LIMIT 1;
$$;

-- Create new policies using the security definer function
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Superadmin and admin can view all profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = user_id OR 
  public.get_user_role(auth.uid()) = ANY(ARRAY['superadmin', 'admin'])
);

CREATE POLICY "Superadmin and admin can update all profiles"
ON public.profiles
FOR UPDATE
USING (
  auth.uid() = user_id OR 
  public.get_user_role(auth.uid()) = ANY(ARRAY['superadmin', 'admin'])
);

CREATE POLICY "Superadmin and admin can insert profiles"
ON public.profiles
FOR INSERT
WITH CHECK (
  public.get_user_role(auth.uid()) = ANY(ARRAY['superadmin', 'admin'])
);