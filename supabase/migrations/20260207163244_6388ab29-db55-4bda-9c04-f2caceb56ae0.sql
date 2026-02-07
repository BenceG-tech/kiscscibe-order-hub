-- Drop the old admin-only update policy
DROP POLICY IF EXISTS "Admins can update order status" ON public.orders;

-- Create new policy that allows both admin and staff to update orders
CREATE POLICY "Admin and staff can update order status"
ON public.orders
FOR UPDATE
USING (is_admin_or_staff(auth.uid()))
WITH CHECK (is_admin_or_staff(auth.uid()));