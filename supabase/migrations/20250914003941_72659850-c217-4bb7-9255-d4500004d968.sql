-- Critical security fix: Implement RLS policies for order-related tables
-- Fix: Use explicit function signature to avoid ambiguity

-- 1. First, remove the overly permissive policies that allow anyone to read order data  
DROP POLICY IF EXISTS "Order items are publicly readable" ON public.order_items;
DROP POLICY IF EXISTS "Order item options are publicly readable" ON public.order_item_options;

-- 2. Create secure RLS policies for orders table
-- Orders should only be visible to admins
CREATE POLICY "Admin can view all orders" 
ON public.orders 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- 3. Create secure RLS policies for order_items table  
CREATE POLICY "Admin can view all order items"
ON public.order_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- 4. Create secure RLS policies for order_item_options table
CREATE POLICY "Admin can view all order item options"
ON public.order_item_options
FOR SELECT  
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Note: Customers access their orders via the secure get_customer_order(code, phone) function
-- This ensures phone + order code verification before returning order data