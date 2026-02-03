-- Step 1.2: Create helper function for staff access
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(COALESCE(_user_id, auth.uid()), 'staff')
$$;

-- Step 1.3: Create helper function for admin OR staff access
CREATE OR REPLACE FUNCTION public.is_admin_or_staff(_user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(COALESCE(_user_id, auth.uid()), 'admin')
      OR public.has_role(COALESCE(_user_id, auth.uid()), 'staff')
$$;

-- Step 1.4: Update RLS policies for orders table
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;

CREATE POLICY "Admin and staff can view orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (is_admin_or_staff(auth.uid()));

-- Step 1.5: Update RLS policies for order_items table
DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;

CREATE POLICY "Admin and staff can view order items"
  ON public.order_items
  FOR SELECT
  TO authenticated
  USING (is_admin_or_staff(auth.uid()));

-- Step 1.6: Update RLS policies for order_item_options table
DROP POLICY IF EXISTS "Admins can view all order item options" ON public.order_item_options;

CREATE POLICY "Admin and staff can view order item options"
  ON public.order_item_options
  FOR SELECT
  TO authenticated
  USING (is_admin_or_staff(auth.uid()));