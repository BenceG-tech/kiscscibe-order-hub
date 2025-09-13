-- Phase 1: Critical Security Fixes (Fixed)

-- 1. Remove public read access from orders table and create admin-only policies
DROP POLICY IF EXISTS "Orders are publicly readable" ON public.orders;

-- Create admin-only policy for orders (will be updated once we have user roles)
CREATE POLICY "Admin can view all orders" 
ON public.orders 
FOR SELECT 
USING (false); -- Temporarily block all access until we have roles

CREATE POLICY "Admin can update orders" 
ON public.orders 
FOR UPDATE 
USING (false); -- Temporarily block all access until we have roles

-- 2. Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can create their profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 3. Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.get_user_role(check_user_id UUID DEFAULT NULL)
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles 
  WHERE user_id = COALESCE(check_user_id, auth.uid())
  LIMIT 1;
$$;

-- 4. Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = COALESCE(check_user_id, auth.uid()) 
    AND role = 'admin'
  );
$$;

-- 5. Update orders policies to use role-based access
DROP POLICY IF EXISTS "Admin can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admin can update orders" ON public.orders;

CREATE POLICY "Admin can view all orders" 
ON public.orders 
FOR SELECT 
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admin can update orders" 
ON public.orders 
FOR UPDATE 
TO authenticated
USING (public.is_admin());

-- 6. Create secure customer order lookup function
CREATE OR REPLACE FUNCTION public.get_customer_order(order_code TEXT, customer_phone TEXT)
RETURNS TABLE (
  id UUID,
  code TEXT,
  name TEXT,
  phone TEXT,
  total_huf INTEGER,
  status TEXT,
  payment_method TEXT,
  pickup_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
)
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    o.id,
    o.code,
    o.name,
    o.phone,
    o.total_huf,
    o.status,
    o.payment_method,
    o.pickup_time,
    o.created_at,
    o.notes
  FROM public.orders o
  WHERE o.code = order_code 
  AND o.phone = customer_phone
  LIMIT 1;
$$;

-- 7. Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    'customer'
  );
  RETURN NEW;
END;
$$;

-- 8. Create trigger for automatic profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. Create function to update profile timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 10. Create trigger for profile timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 11. Secure settings table (remove public read access and fix existing policies)
DROP POLICY IF EXISTS "Settings are publicly readable" ON public.settings;
DROP POLICY IF EXISTS "Admin can manage settings" ON public.settings;
DROP POLICY IF EXISTS "Admin can view settings" ON public.settings;

CREATE POLICY "Admin can view settings" 
ON public.settings 
FOR SELECT 
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admin can manage settings" 
ON public.settings 
FOR ALL 
TO authenticated
USING (public.is_admin());