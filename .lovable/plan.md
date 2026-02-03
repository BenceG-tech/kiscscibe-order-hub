
# Plan: Staff Login with Read-Only Order Access

## Overview
Create a new "staff" role that allows restaurant employees to log in and view orders without the ability to modify anything on the website or admin interface.

## Current State Analysis
- **Authentication**: Uses Supabase Auth with profiles table and a secure `user_roles` table
- **Roles**: Current `app_role` enum has only `admin` and `customer`
- **RLS Policies**: Orders are protected with `is_admin()` checks for SELECT and UPDATE
- **Admin Interface**: All admin routes use `requireAdmin` protection
- **Order Actions**: Staff can currently update order status (preparing, ready, completed, cancelled)

## Implementation Plan

### Step 1: Database Changes

#### 1.1 Add 'staff' to the app_role enum
```sql
ALTER TYPE public.app_role ADD VALUE 'staff';
```

#### 1.2 Create helper function for staff access
```sql
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(COALESCE(_user_id, auth.uid()), 'staff')
$$;
```

#### 1.3 Create helper function for admin OR staff access
```sql
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
```

#### 1.4 Update RLS policies for orders table
- **SELECT**: Allow both admin AND staff to view orders
- **UPDATE**: Keep admin-only (staff cannot modify)

```sql
-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;

-- Create new SELECT policy for admin and staff
CREATE POLICY "Admin and staff can view orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (is_admin_or_staff(auth.uid()));
```

#### 1.5 Update RLS policies for order_items table
```sql
-- Drop existing SELECT policy  
DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;

-- Create new SELECT policy for admin and staff
CREATE POLICY "Admin and staff can view order items"
  ON public.order_items
  FOR SELECT
  TO authenticated
  USING (is_admin_or_staff(auth.uid()));
```

### Step 2: Frontend Changes

#### 2.1 Update AuthContext.tsx
Add `isStaff` state and expose both `isAdmin` and `isStaff` flags:

```typescript
interface AuthContextType {
  // ... existing fields
  isAdmin: boolean;
  isStaff: boolean;
  canViewOrders: boolean; // admin OR staff
}
```

Check staff status via RPC:
```typescript
const { data: isStaffResult } = await supabase.rpc('is_staff');
setIsStaffState(isStaffResult === true);
```

#### 2.2 Update ProtectedRoute.tsx
Add support for staff-only routes:

```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireStaff?: boolean; // New: allows admin OR staff
}
```

#### 2.3 Create Staff Orders Page
Create a new read-only version of the orders page for staff:

**New file: `src/pages/staff/StaffOrders.tsx`**
- Shows all order information (same as admin view)
- **Removes all action buttons** (no status updates, no cancel)
- Only shows "Call" button for contacting customers
- Uses a modified `StaffLayout` with only the orders tab

#### 2.4 Create StaffLayout Component
**New file: `src/pages/staff/StaffLayout.tsx`**
- Simplified layout with only Orders tab
- Shows "Személyzet" badge instead of role
- No navigation to menu, daily offers, or gallery

#### 2.5 Update App.tsx Routes
Add staff routes:

```typescript
<Route path="/staff/orders" element={
  <ProtectedRoute requireStaff>
    <StaffOrders />
  </ProtectedRoute>
} />
```

#### 2.6 Update Auth Redirect Logic
When a staff member logs in, redirect them to `/staff/orders` instead of admin pages.

### Step 3: Admin Layout Adjustments

#### 3.1 Update AdminLayout.tsx
Hide modification buttons when the user is staff (fallback if staff somehow accesses admin routes):

```typescript
const { isAdmin, isStaff } = useAuth();
const canModify = isAdmin && !isStaff;
```

#### 3.2 Update OrdersManagement.tsx  
Conditionally hide action buttons based on user role:

```typescript
{canModify && order.status === 'new' && (
  <Button onClick={() => updateOrderStatus(order.id, 'preparing')}>
    Készítés megkezdése
  </Button>
)}
```

## File Changes Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `supabase/migrations/xxx.sql` | CREATE | Add staff role, helper functions, update RLS |
| `src/contexts/AuthContext.tsx` | MODIFY | Add isStaff state and canViewOrders flag |
| `src/components/ProtectedRoute.tsx` | MODIFY | Add requireStaff prop |
| `src/pages/staff/StaffLayout.tsx` | CREATE | Simplified layout for staff |
| `src/pages/staff/StaffOrders.tsx` | CREATE | Read-only orders view |
| `src/App.tsx` | MODIFY | Add staff routes |
| `src/pages/Auth.tsx` | MODIFY | Redirect staff to /staff/orders |
| `src/pages/admin/OrdersManagement.tsx` | MODIFY | Hide action buttons for non-admins |

## Security Model

```text
┌─────────────────────────────────────────────────────────────┐
│                     USER ROLES                               │
├─────────────────────────────────────────────────────────────┤
│  ADMIN                                                       │
│  ├── Can view orders ✓                                       │
│  ├── Can update order status ✓                               │
│  ├── Can manage menu items ✓                                 │
│  ├── Can manage daily offers ✓                               │
│  └── Can manage gallery ✓                                    │
├─────────────────────────────────────────────────────────────┤
│  STAFF                                                       │
│  ├── Can view orders ✓                                       │
│  ├── Can update order status ✗                               │
│  ├── Can manage menu items ✗                                 │
│  ├── Can manage daily offers ✗                               │
│  └── Can manage gallery ✗                                    │
├─────────────────────────────────────────────────────────────┤
│  CUSTOMER                                                    │
│  ├── Can place orders ✓                                      │
│  └── All admin functions ✗                                   │
└─────────────────────────────────────────────────────────────┘
```

## How to Add Staff Users

After implementation, admins can add staff members by:
1. Have the person sign up via `/auth`
2. Admin adds their role in the database:
   ```sql
   INSERT INTO user_roles (user_id, role) 
   VALUES ('user-uuid-here', 'staff');
   ```

(Future enhancement: Add admin UI for managing staff users)

## Technical Notes

- **RLS Enforcement**: Staff can only SELECT orders at the database level - UPDATE policy remains admin-only
- **No Client-Side Bypass**: Role checks use secure `is_admin()` and `is_staff()` RPC functions
- **Separate Routes**: Staff get their own `/staff/*` routes for clean separation
- **Real-time Updates**: Staff will see new orders arrive in real-time (read-only subscription)
