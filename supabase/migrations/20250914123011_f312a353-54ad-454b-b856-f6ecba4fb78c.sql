-- Clean up conflicting UPDATE policies on the orders table
-- There are two conflicting UPDATE policies that the security scanner is flagging

-- Remove the old conflicting UPDATE policies
DROP POLICY IF EXISTS "Admin can manage orders" ON public.orders;
DROP POLICY IF EXISTS "Admin can update orders" ON public.orders;

-- Create a single, clear UPDATE policy for admins
CREATE POLICY "Only authenticated admins can update orders" 
ON public.orders 
FOR UPDATE 
USING (
  -- Only allow updates if user is authenticated AND is an admin
  auth.uid() IS NOT NULL AND public.is_admin(auth.uid())
);

-- Verify our policies are clean and consistent
-- The orders table should now have:
-- 1. INSERT: Anyone can create orders (for guest customers)
-- 2. SELECT: Only authenticated admins can view orders
-- 3. UPDATE: Only authenticated admins can update orders
-- Customer access is via get_customer_order() function which uses SECURITY DEFINER