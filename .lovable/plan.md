

# Plan: Fix Infinite Redirect Loop and Hide Admin Login

## Issues Identified

### Issue 1: Infinite Redirect Loop
The "Maximum update depth exceeded" error occurs because:
1. User logs in at `/auth`
2. `Auth.tsx` useEffect sees `user` is set and navigates to `/admin/orders` (or `/staff/orders`)
3. `ProtectedRoute` component checks `isAdmin`/`canViewOrders`, but these are still `false` (RPC calls haven't completed)
4. `ProtectedRoute` redirects back to `/auth`
5. `Auth.tsx` sees user is logged in, navigates back to admin/staff route
6. This creates an infinite loop

**Root Cause**: The `loading` state becomes `false` before the role checks complete. The role checks are deferred with `setTimeout` but the `loading` flag doesn't account for this.

### Issue 2: Admin Login is Visible
The `/auth` page openly advertises "Adminisztrációs felület eléréséhez" (For administration access), making it obvious this is an admin login page.

---

## Solution

### Fix 1: Track Role Loading State Separately

Add a `rolesLoading` state that tracks whether the role RPC calls have completed, and consider both `loading` AND `rolesLoading` when checking authentication state.

**Changes to `src/contexts/AuthContext.tsx`:**
- Add `rolesLoading` state (starts as `true` when user exists)
- Set `rolesLoading = false` after role RPC calls complete
- Export `rolesLoading` or combine it with `loading`

### Fix 2: Update ProtectedRoute to Wait for Roles

**Changes to `src/components/ProtectedRoute.tsx`:**
- Wait for both `loading` and role checks to complete before deciding to redirect
- Use a combined loading check

### Fix 3: Update Auth.tsx to Wait for Roles

**Changes to `src/pages/Auth.tsx`:**
- Wait for role data before navigating to admin/staff routes
- Only redirect once we know the actual role

### Fix 4: Hide Admin Login

**Changes to `src/pages/Auth.tsx`:**
- Remove the "Adminisztrációs felület eléréséhez" text
- Make the login page look like a generic login without admin/staff hints
- Remove the registration tab entirely (admins/staff are added via SQL, not self-registration)
- Use a neutral description like "Belépés" (Login) only

---

## Detailed Implementation

### Step 1: Update AuthContext.tsx

```typescript
// Add new state for tracking role loading
const [rolesLoading, setRolesLoading] = useState(false);

// In fetchProfile function:
const fetchProfile = async (userId: string) => {
  setRolesLoading(true); // Start loading roles
  try {
    // ... existing profile fetch code ...
    
    // Check admin and staff status
    const { data: isAdminResult } = await supabase.rpc('is_admin');
    setIsAdminState(isAdminResult === true);

    const { data: isStaffResult } = await supabase.rpc('is_staff');
    setIsStaffState(isStaffResult === true);
  } catch (error) {
    console.error('Error fetching profile:', error);
  } finally {
    setRolesLoading(false); // Done loading roles
  }
};

// Update the value export
const value = {
  // ... existing values ...
  rolesLoading, // Add this
};
```

### Step 2: Update ProtectedRoute.tsx

```typescript
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false,
  requireStaff = false
}) => {
  const { user, loading, rolesLoading, isAdmin, canViewOrders } = useAuth();
  const location = useLocation();

  // Wait for both auth AND roles to load
  if (loading || rolesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Now role checks are safe because rolesLoading is false
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />; // Go home, not auth (avoid loop)
  }

  if (requireStaff && !canViewOrders) {
    return <Navigate to="/" replace />; // Go home, not auth (avoid loop)
  }

  return <>{children}</>;
};
```

### Step 3: Update Auth.tsx

```typescript
// Update dependency array and conditions
const { user, signIn, signUp, isAdmin, isStaff, loading: authLoading, rolesLoading } = useAuth();

// Update the redirect useEffect
useEffect(() => {
  // Wait for auth AND role loading to complete
  if (user && !authLoading && !rolesLoading) {
    if (from !== '/' && from !== '/auth') {
      navigate(from, { replace: true });
    } else if (isAdmin) {
      navigate('/admin/orders', { replace: true });
    } else if (isStaff) {
      navigate('/staff/orders', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  }
}, [user, authLoading, rolesLoading, isAdmin, isStaff, navigate, from]);

// Show loading while roles are being checked
if (user && rolesLoading) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner />
    </div>
  );
}
```

### Step 4: Hide Admin Login UI

Transform the `/auth` page to be a simple, hidden login:
- Remove `CardDescription` that mentions admin
- Remove the `Tabs` component (no registration tab)
- Keep only the sign-in form
- Change title from "Bejelentkezés" to just show a neutral title
- Access via `/auth` remains but looks like a generic login

---

## File Changes Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `src/contexts/AuthContext.tsx` | MODIFY | Add `rolesLoading` state, export it |
| `src/components/ProtectedRoute.tsx` | MODIFY | Wait for `rolesLoading`, redirect to `/` not `/auth` |
| `src/pages/Auth.tsx` | MODIFY | Wait for roles before redirect, hide admin hints, remove registration |

---

## Security Considerations

- **No exposed admin endpoint**: The `/auth` page won't reveal it's for admins
- **No self-registration**: Staff/admin users must be added via database
- **No infinite loops**: Proper loading state handling prevents redirect storms
- **Unauthorized users redirected home**: Instead of back to auth (which could loop)

