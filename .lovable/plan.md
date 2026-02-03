
# Plan: Fix Admin Login - Database Function Overload Conflict

## Problem Identified

The admin login is broken because the `is_admin` RPC call is returning a **300 error**:

```
"Could not choose the best candidate function between: 
public.is_admin(), public.is_admin(check_user_id => uuid)"
```

There are **two versions** of the `is_admin` function in the database:
1. `is_admin()` - no parameters
2. `is_admin(check_user_id uuid DEFAULT NULL)` - with optional parameter

When the frontend calls `supabase.rpc('is_admin')`, PostgREST cannot determine which function to use.

## Solution

**Drop the duplicate parameterless function** from the database. Keep only the version with the optional parameter, which already defaults to `NULL` and uses `auth.uid()` when no parameter is provided.

## Implementation Steps

### Step 1: Database Migration

Run a SQL migration to drop the duplicate `is_admin()` function (the one without parameters):

```sql
-- Drop the parameterless version of is_admin
-- Keep only is_admin(check_user_id uuid DEFAULT NULL) which handles both cases
DROP FUNCTION IF EXISTS public.is_admin();
```

The remaining `is_admin(check_user_id uuid DEFAULT NULL)` function will work correctly when called without parameters because:
- PostgREST will call it with `NULL` as the default
- The function uses `COALESCE(check_user_id, auth.uid())` to fall back to the current user's ID

### Step 2: Verify the Fix

After the migration, the login flow will work:
1. User signs in at `/auth`
2. `AuthContext` calls `supabase.rpc('is_admin')` 
3. PostgREST correctly routes to `is_admin(check_user_id => NULL)`
4. Function returns `true` for admin users
5. User is redirected to `/admin/orders`

## File Changes

| File | Change Type | Description |
|------|-------------|-------------|
| Database Migration | CREATE | Drop the duplicate `is_admin()` function |

## No Frontend Changes Needed

The frontend code in `AuthContext.tsx` (line 70) will continue to work as-is once the database has only one function signature.

## Technical Details

The kept function signature:
```sql
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id uuid DEFAULT NULL::uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT public.has_role(COALESCE(check_user_id, auth.uid()), 'admin')
$function$
```

This function:
- Accepts an optional `check_user_id` parameter
- Defaults to `NULL` if not provided
- Uses `COALESCE` to fall back to `auth.uid()` (current authenticated user)
- Securely checks the `user_roles` table via the `has_role` helper
