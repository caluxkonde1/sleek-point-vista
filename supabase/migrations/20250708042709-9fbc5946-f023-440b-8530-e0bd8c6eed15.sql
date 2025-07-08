-- Disable RLS temporarily
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop all policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin access to all profiles" ON public.profiles;

-- Create a function to check if user is admin (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  -- This function runs with elevated privileges and bypasses RLS
  SELECT role INTO user_role 
  FROM public.profiles 
  WHERE user_id = auth.uid();
  
  RETURN COALESCE(user_role IN ('superadmin', 'admin'), false);
END;
$$;

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create new policies without recursion
CREATE POLICY "profile_select_policy"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = user_id OR public.is_admin_user()
);

CREATE POLICY "profile_update_policy"
ON public.profiles
FOR UPDATE
USING (
  auth.uid() = user_id OR public.is_admin_user()
);

CREATE POLICY "profile_insert_policy"
ON public.profiles
FOR INSERT
WITH CHECK (public.is_admin_user());