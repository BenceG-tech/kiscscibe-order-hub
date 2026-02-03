# Plan: Staff Login with Read-Only Order Access

## Status: ✅ IMPLEMENTED

## Overview
Created a new "staff" role that allows restaurant employees to log in and view orders without the ability to modify anything on the website or admin interface.

## Changes Made

### Database Changes
1. Added `'staff'` to the `app_role` enum
2. Created `is_staff(_user_id uuid)` security definer function
3. Created `is_admin_or_staff(_user_id uuid)` security definer function  
4. Updated RLS policies on `orders`, `order_items`, and `order_item_options` tables to allow SELECT for both admin and staff

### Frontend Changes
1. **`src/contexts/AuthContext.tsx`** - Added `isStaff` and `canViewOrders` flags
2. **`src/components/ProtectedRoute.tsx`** - Added `requireStaff` prop
3. **`src/pages/staff/StaffLayout.tsx`** - Created simplified layout for staff (only Orders tab)
4. **`src/pages/staff/StaffOrders.tsx`** - Created read-only orders view (no action buttons except Call)
5. **`src/App.tsx`** - Added staff routes
6. **`src/pages/Auth.tsx`** - Updated redirect logic for staff users

## Security Model

| Role | View Orders | Modify Orders | Menu/Gallery/Daily Offers |
|------|-------------|---------------|---------------------------|
| Admin | ✅ | ✅ | ✅ |
| Staff | ✅ | ❌ | ❌ |
| Customer | ❌ | ❌ | ❌ |

## How to Add Staff Users

1. Have the person sign up via `/auth`
2. Add their role in the database:
   ```sql
   INSERT INTO user_roles (user_id, role) 
   VALUES ('user-uuid-here', 'staff');
   ```
