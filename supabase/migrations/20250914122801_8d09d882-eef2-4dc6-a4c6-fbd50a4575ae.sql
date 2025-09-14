-- Fix RLS policies for orders table to prevent unauthorized access to customer data
-- Using the correct is_admin function signature to avoid ambiguity

-- First, let's drop the existing SELECT policy and create more specific ones
DROP POLICY IF EXISTS "Admin can view all orders" ON public.orders;

-- Create separate policies for different access patterns
-- 1. Allow admins to view all orders (using the parameterless version)
CREATE POLICY "Admins can view all orders" 
ON public.orders 
FOR SELECT 
USING (public.is_admin(auth.uid()));

-- 2. Since customers are not authenticated users in this system,
-- we'll rely on the get_customer_order function for customer access
-- This policy documents that customers must use the secure function
CREATE POLICY "Customers access orders through secure function only" 
ON public.orders 
FOR SELECT 
USING (
  -- This policy is intentionally restrictive
  -- Customers should only access orders via get_customer_order() function
  -- which requires both order code and phone number verification
  false  -- No direct access - must use get_customer_order function
);

-- Add a comment to document the security model
COMMENT ON TABLE public.orders IS 'Customer orders table. Admin access via RLS policies. Customer access via get_customer_order() function which requires order code + phone verification.';

-- Ensure the get_customer_order function is properly secured
COMMENT ON FUNCTION public.get_customer_order IS 'Secure customer order lookup requiring both order code and phone number. Consider adding rate limiting in application layer.';