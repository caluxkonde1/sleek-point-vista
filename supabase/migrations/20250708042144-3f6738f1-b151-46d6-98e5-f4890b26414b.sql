-- Drop all existing policies on profiles table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Superadmin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Superadmin can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Superadmin can insert profiles" ON public.profiles;

-- Create a security definer function to check user roles without recursion
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text
  FROM public.profiles
  WHERE user_id = _user_id
  LIMIT 1;
$$;

-- Create new non-recursive policies
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admin access to all profiles"
ON public.profiles
FOR ALL
USING (
  CASE 
    WHEN auth.uid() = user_id THEN true
    ELSE (
      EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.user_id = auth.uid() 
        AND p.role IN ('superadmin', 'admin')
      )
    )
  END
);