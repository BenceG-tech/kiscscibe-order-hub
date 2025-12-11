-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'customer');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS Policies for user_roles table
-- Only admins can view all roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Only service_role can insert/update/delete roles (no user access)
CREATE POLICY "Service role can manage roles"
ON public.user_roles
FOR ALL
USING (auth.role() = 'service_role');

-- Migrate existing admins from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'admin'::app_role
FROM public.profiles
WHERE role = 'admin'
ON CONFLICT (user_id, role) DO NOTHING;

-- Update is_admin function to use new user_roles table
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(COALESCE(check_user_id, auth.uid()), 'admin')
$$;

-- Update the no-arg version too
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

-- Update get_user_role to use new table
CREATE OR REPLACE FUNCTION public.get_user_role(check_user_id uuid DEFAULT NULL)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM public.user_roles 
  WHERE user_id = COALESCE(check_user_id, auth.uid())
  LIMIT 1
$$;

-- Update bootstrap_first_admin to use new table
CREATE OR REPLACE FUNCTION public.bootstrap_first_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    admin_count integer;
    first_user_id uuid;
BEGIN
    -- Check if any admin already exists in user_roles
    SELECT COUNT(*) INTO admin_count
    FROM user_roles
    WHERE role = 'admin';
    
    -- If no admin exists, make the first user an admin
    IF admin_count = 0 THEN
        -- Get the first user (by creation date)
        SELECT user_id INTO first_user_id
        FROM profiles
        ORDER BY created_at ASC
        LIMIT 1;
        
        -- If we found a user, make them admin
        IF first_user_id IS NOT NULL THEN
            INSERT INTO user_roles (user_id, role)
            VALUES (first_user_id, 'admin')
            ON CONFLICT (user_id, role) DO NOTHING;
            
            RETURN true;
        END IF;
    END IF;
    
    RETURN false;
END;
$$;