-- Fix infinite recursion in profiles RLS policies
-- Drop the problematic policy that references the same table
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create a new safe policy for admins to view all profiles
-- This policy uses the is_admin() function which should be security definer
CREATE POLICY "Admins can view all profiles"
ON public.profiles 
FOR SELECT 
USING (public.is_admin(auth.uid()));