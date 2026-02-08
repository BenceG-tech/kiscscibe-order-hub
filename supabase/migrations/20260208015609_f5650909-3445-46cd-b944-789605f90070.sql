-- Allow admins to delete orders
CREATE POLICY "Admin can delete orders"
ON public.orders
FOR DELETE
USING (is_admin(auth.uid()));

-- Allow admins to delete order items
CREATE POLICY "Admin can delete order items"
ON public.order_items
FOR DELETE
USING (is_admin(auth.uid()));

-- Allow admins to delete order item options
CREATE POLICY "Admin can delete order item options"
ON public.order_item_options
FOR DELETE
USING (is_admin(auth.uid()));