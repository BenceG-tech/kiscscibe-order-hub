
# Staff Notification Fix

## Root Cause Analysis

After thorough investigation, the notification system code is structurally correct:
- The `orders` table IS in the `supabase_realtime` publication (confirmed via DB query)
- RLS policies are PERMISSIVE (not restrictive) for admin/staff
- `OrderNotificationsProvider` is correctly placed inside `AuthProvider` and `BrowserRouter`
- The `useGlobalOrderNotifications` hook subscribes to INSERT events correctly

The problem is that the **realtime subscription has zero error handling**. The `.subscribe()` call has no status callback, so if the WebSocket connection fails, the subscription is silently rejected, or the auth token isn't properly set for the realtime connection, there is no feedback or recovery mechanism. This makes the system fragile and impossible to debug.

## Fixes

### 1. Add subscription status callbacks and retry logic (`useGlobalOrderNotifications.tsx`)

The current subscription code:
```text
.subscribe();  // No status handling!
```

Will be changed to include:
- Status callback logging (SUBSCRIBED, TIMED_OUT, CHANNEL_ERROR, CLOSED)
- Automatic retry if the subscription fails (up to 3 retries with exponential backoff)
- Console logging so the issue can be diagnosed in real-time

### 2. Ensure realtime subscription uses authenticated context

Add a check to verify the Supabase client has an active session before subscribing. If the auth session isn't ready, defer the subscription until it is:
- Access the current session from the Supabase client
- Log whether the subscription is being made with an authenticated user
- If no session, skip subscription (the `OrderNotificationsProvider` already handles this via `canViewOrders`, but a belt-and-suspenders check in the hook helps with timing issues)

### 3. Subscription reconnection on auth state change

Add a listener for auth state changes (TOKEN_REFRESHED) and re-establish the subscription when the token changes. This ensures the realtime WebSocket uses the latest JWT.

## Technical Details

### File: `src/hooks/useGlobalOrderNotifications.tsx`

Changes:
- Add subscription status callback with comprehensive logging
- Add retry logic with exponential backoff for failed subscriptions
- Add session validation before subscribing
- Log the channel state for debugging
- Add auth state listener to re-subscribe on token refresh

### File: `src/contexts/OrderNotificationsContext.tsx`

No changes needed - the provider logic is correct.

### File: `src/App.tsx`

No changes needed - the provider placement is correct.

## Summary

| File | Change |
|------|--------|
| `src/hooks/useGlobalOrderNotifications.tsx` | Add subscription error handling, retry logic, auth validation, and diagnostic logging |

After this fix, if the subscription fails, the console will show exactly why (CHANNEL_ERROR, TIMED_OUT, etc.) and the system will automatically retry. This will either fix the issue outright (if it's a timing/retry issue) or provide clear diagnostic information to identify the root cause.
