-- Critical security fix: Implement RLS policies for order-related tables

-- 1. First, remove the overly permissive policies that allow anyone to read order data
DROP POLICY IF EXISTS "Order items are publicly readable" ON public.order_items;
DROP POLICY IF EXISTS "Order item options are publicly readable" ON public.order_item_options;

-- 2. Create secure RLS policies for orders table
-- Orders should only be visible to admins or via the specific get_customer_order function
DROP POLICY IF EXISTS "Admin can view all orders" ON public.orders;
CREATE POLICY "Admin can view all orders" 
ON public.orders 
FOR SELECT 
USING (public.is_admin());

-- Anyone can still create orders (for checkout process)
-- Admin can update orders (status changes)
-- No direct SELECT policy for regular users (they use get_customer_order function)

-- 3. Create secure RLS policies for order_items table  
CREATE POLICY "Admin can view all order items"
ON public.order_items
FOR SELECT
USING (public.is_admin());

CREATE POLICY "Order items viewable via admin or customer lookup"
ON public.order_items  
FOR SELECT
USING (
  public.is_admin() OR 
  EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = order_items.order_id 
    AND public.is_admin()
  )
);

-- 4. Create secure RLS policies for order_item_options table
CREATE POLICY "Admin can view all order item options"
ON public.order_item_options
FOR SELECT  
USING (public.is_admin());

CREATE POLICY "Order item options viewable via admin or customer lookup"
ON public.order_item_options
FOR SELECT
USING (
  public.is_admin() OR
  EXISTS (
    SELECT 1 FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE oi.id = order_item_options.order_item_id
    AND public.is_admin()
  )
);

-- 5. Ensure the existing get_customer_order function is the secure way for customers to access their orders
-- This function already exists and uses phone + code verification