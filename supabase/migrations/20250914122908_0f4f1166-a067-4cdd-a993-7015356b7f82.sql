-- Fix the orders table RLS policies with a single, comprehensive policy
-- Remove the "conflicting" policies and create one clear policy

-- Drop existing SELECT policies
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Customers access orders through secure function only" ON public.orders;

-- Create a single, clear policy that only allows authenticated admins to view orders
-- This addresses the security concern while maintaining the existing functionality
CREATE POLICY "Only authenticated admins can view orders" 
ON public.orders 
FOR SELECT 
USING (
  -- Only allow access if user is authenticated AND is an admin
  auth.uid() IS NOT NULL AND public.is_admin(auth.uid())
);

-- Update the table comment to be more explicit about the security model
COMMENT ON TABLE public.orders IS 'Secure customer orders table. Direct access restricted to authenticated admin users only. Customer order lookups must use get_customer_order() function with order code and phone verification.';

-- Also fix the capacity_slots table security issue while we're at it
-- Currently anyone can update capacity slots, which is a security risk
DROP POLICY IF EXISTS "Anyone can update capacity slots" ON public.capacity_slots;

-- Create a policy that only allows admin updates to capacity slots
CREATE POLICY "Only admins can update capacity slots" 
ON public.capacity_slots 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND public.is_admin(auth.uid())
);

-- The submit-order function needs to update capacity slots, so we need to allow
-- the service role to update capacity slots as well
CREATE POLICY "Service role can update capacity slots" 
ON public.capacity_slots 
FOR UPDATE 
USING (
  -- Allow updates from the service role (used by edge functions)
  auth.role() = 'service_role'
);