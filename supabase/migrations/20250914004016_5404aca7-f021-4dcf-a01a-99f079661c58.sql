-- Remove dangerous publicly readable policies and replace with secure admin-only policies

-- Remove the dangerous public read policies
DROP POLICY "Order items are publicly readable" ON public.order_items;
DROP POLICY "Order item options are publicly readable" ON public.order_item_options;

-- Create secure admin-only read policies for order_items
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

-- Create secure admin-only read policies for order_item_options  
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

-- Note: The orders table already has secure "Admin can view all orders" policy
-- Customers access their order data via get_customer_order(code, phone) function which bypasses RLS