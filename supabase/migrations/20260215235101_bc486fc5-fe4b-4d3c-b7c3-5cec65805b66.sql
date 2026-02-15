-- Allow staff to update daily_offer_items (for sold-out toggle)
-- The existing "Admin can update daily offer items" policy uses is_admin().
-- We add a new PERMISSIVE policy for staff.
-- Note: existing policies are RESTRICTIVE, so we need a permissive one for staff.
-- Actually, looking at existing policies they are all RESTRICTIVE (Permissive: No).
-- Let's just modify the existing admin UPDATE policy to use is_admin_or_staff instead.

-- Drop the existing admin-only UPDATE policy
DROP POLICY IF EXISTS "Admin can update daily offer items" ON public.daily_offer_items;

-- Create new policy that allows both admin and staff to update
CREATE POLICY "Admin and staff can update daily offer items"
ON public.daily_offer_items
FOR UPDATE
USING (is_admin_or_staff(auth.uid()));
