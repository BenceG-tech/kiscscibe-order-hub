-- Fix Profiles table RLS policies
-- Add admin SELECT policy so admins can view all user profiles for management
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'admin'
  )
);

-- Fix Subscribers table RLS policies  
-- Remove conflicting policies first
DROP POLICY IF EXISTS "Admin can view subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "Subscribers are not publicly readable" ON public.subscribers;

-- Create clear admin-only SELECT policy for subscribers
CREATE POLICY "Only admins can view subscribers" 
ON public.subscribers 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'admin'
  )
);

-- Verify subscribers can still sign up publicly (this policy should already exist)
-- CREATE POLICY "Anyone can subscribe to newsletter" 
-- ON public.subscribers 
-- FOR INSERT 
-- TO public 
-- WITH CHECK (true);