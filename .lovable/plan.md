
# AUDIT AND IMPROVEMENT PLAN -- Kiscsibe Order Hub

A comprehensive security, architecture, UX, and future-proofing audit.

---

## Pillar 1: Architecture and Database Integrity

### 1.1 Capacity Management Conflict (Priority: HIGH)

**Finding:** Two parallel systems exist for limiting orders:
- `capacity_slots` table: time-slot based booking (max_orders / booked_orders per 30-min slot)
- `remaining_portions` fields on `daily_offers`, `daily_menus`, `daily_offer_menus`: item-level stock

These serve different purposes but overlap conceptually. In `submit-order/index.ts` (lines 370-451), the capacity slot system runs independently of the portions system (lines 246-256), meaning a single order decrements BOTH systems. If either one blocks, the order fails -- but they are not transactionally linked.

**Risk:** An order could decrement `remaining_portions` successfully but then fail on `capacity_slots`, leaving orphaned portion decrements with no rollback.

**Proposed Solution (step-by-step):**
1. Wrap the entire order in a database transaction (use a single `plpgsql` function called via `supabase.rpc()` that handles both portion decrement AND capacity booking atomically)
2. Alternatively, move capacity slot update BEFORE portion updates so the cheaper check fails first
3. Long-term: consider if `capacity_slots` is truly needed -- if it duplicates the concept of "how many orders can we handle per time slot," it could be replaced by a simple per-slot counter derived from order count queries

### 1.2 Race Condition in Capacity Slots (Priority: CRITICAL)

**Finding:** The `update_daily_portions` RPC function uses `FOR UPDATE` row locks -- this is correctly race-safe. However, the `capacity_slots` update in `submit-order/index.ts` (lines 434-450) does NOT use atomic updates. It reads `booked_orders`, checks the value client-side, then issues a separate UPDATE. Two concurrent orders could both read `booked_orders = 7` (max 8), both pass the check, and both increment to 8 -- resulting in overbooking.

```typescript
// CURRENT (UNSAFE - lines 434-445):
if (capacityData.booked_orders >= capacityData.max_orders) { throw ... }
await supabase.from('capacity_slots')
  .update({ booked_orders: capacityData.booked_orders + 1 })
```

**Proposed Solution:** Create an `update_capacity_slot` RPC function similar to `update_daily_portions` that uses `FOR UPDATE` locks:

```sql
CREATE OR REPLACE FUNCTION update_capacity_slot(slot_date date, slot_time time, qty integer DEFAULT 1)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE current_booked integer; max_cap integer;
BEGIN
  SELECT booked_orders, max_orders INTO current_booked, max_cap
  FROM capacity_slots WHERE date = slot_date AND timeslot = slot_time FOR UPDATE;
  IF current_booked + qty > max_cap THEN
    RAISE EXCEPTION 'Time slot is full';
  END IF;
  UPDATE capacity_slots SET booked_orders = booked_orders + qty
  WHERE date = slot_date AND timeslot = slot_time;
  RETURN true;
END; $$;
```

### 1.3 No Rollback on Partial Failure (Priority: HIGH)

**Finding:** In `submit-order/index.ts`, daily portions are decremented (line 246-256) BEFORE the order is inserted (line 454). If the order insert fails (line 472), the decremented portions are never restored. Similarly, coupon `used_count` is incremented (line 298-301) before the order is created.

**Proposed Solution:** Restructure the edge function to:
1. First validate everything (prices, dates, availability) WITHOUT side effects
2. Then execute all mutations in sequence: order insert first, then portion decrements, then capacity update
3. Add a try/catch with compensating actions (re-increment portions) if later steps fail
4. Ideal long-term: single database function that does all writes atomically

### 1.4 Migration Sprawl (Priority: LOW)

**Finding:** 61 migration files exist. While not technically problematic, this makes debugging schema issues difficult. Many appear to be incremental additions from Sep 2025 through Feb 2026.

**Proposed Solution:** No immediate action needed. Consider a "squash" migration for a fresh deployment baseline after launch stabilizes.

---

## Pillar 2: Security and Validation

### 2.1 Past Order Prevention (Priority: MEDIUM -- Already Well-Implemented)

**Finding:** Three-layer protection is correctly in place:
- **Client (Checkout.tsx lines 354-396):** Validates pickup time is not in the past and within business hours
- **Server (submit-order lines 224-230):** Re-validates daily item dates against today
- **Database trigger (`validate_order_date`):** INSERT-only trigger prevents past pickup times and validates business hours

**One gap:** The edge function validates daily item dates (line 228) but for "ASAP" orders (no `pickup_date`), no date validation occurs beyond what the DB trigger does. The trigger checks `pickup_time`, which is NULL for ASAP orders -- so ASAP orders bypass the DB-level time check.

**Proposed Solution:** In the `validate_order_date` trigger, add a fallback that checks `created_at` against business hours if `pickup_time` is NULL, ensuring ASAP orders can only be placed during open hours (or remove ASAP ordering entirely -- it's unusual for a pickup-only restaurant).

### 2.2 RLS Policies on Orders Table (Priority: LOW -- Already Secure)

**Finding:** The `orders` table RLS is well-configured:
- SELECT/UPDATE: `is_admin_or_staff()` only
- DELETE: `is_admin()` only
- ALL: `service_role` only
- No public or customer-facing SELECT policy exists

Customers access their order data exclusively through `get_customer_order_secure()` -- a `SECURITY DEFINER` function requiring both `order_code` AND `phone`, preventing enumeration.

**Status:** No issues found. This is correctly implemented.

### 2.3 Edge Function Secrets (Priority: LOW -- Already Secure)

**Finding:** All secrets are accessed via `Deno.env.get()`:
- `SUPABASE_URL` (line 61)
- `SUPABASE_SERVICE_ROLE_KEY` (line 62)
- `RESEND_API_KEY` (line 575)

No hardcoded keys found. The `RESEND_API_KEY` is confirmed configured in Supabase secrets.

**One minor concern:** The BCC list in the email (line 665) contains hardcoded email addresses (`kiscsibeetterem@gmail.com`, `gataibence@gmail.com`). These are not security issues but could be moved to a `settings` table or env variable for flexibility.

### 2.4 Modifier/Side Price Trust (Priority: MEDIUM)

**Finding:** For regular items, the server fetches `price_huf` from the database (line 144) -- correct. However, modifier `price_delta_huf` (line 145) and side `price_huf` (line 146) are taken directly from the client-submitted payload without server-side validation.

A malicious user could submit `price_delta_huf: -1000` to get a discount.

**Proposed Solution:** Fetch modifier and side prices from `item_modifier_options` and `menu_items` tables respectively, similar to how menu item prices are validated.

---

## Pillar 3: Admin Interface and UX

### 3.1 Order Status Workflow Efficiency (Priority: MEDIUM)

**Finding:** Status updates are one-at-a-time. The recent bulk delete feature (for past orders) is good but there's no bulk status update for active orders.

**Proposed Solutions:**
1. **Quick-action buttons:** Instead of a dropdown, show direct action buttons per status (e.g., on "new" orders show a single "Elfogadás" button that moves to "preparing")
2. **Keyboard shortcuts:** `A` = accept next new order, `R` = mark next preparing order as ready
3. **Swipe gestures** on mobile for status changes (swipe right = advance status)
4. **Batch select + status change** for morning rush scenarios

### 3.2 Error Handling UX (Priority: MEDIUM)

**Finding:** Most error handling uses `toast()` notifications, which is good. The edge function returns descriptive Hungarian error messages. However:
- Modifier/side insert failures are silently swallowed (lines 548-551, 564-567) -- the order succeeds but data is incomplete
- The "Unique item save failed" troubleshooting item from docs doesn't have a visible UI solution

**Proposed Solution:** Add a `warnings` array to the order response. If non-critical inserts fail, return `{ success: true, warnings: ["Módosító mentése sikertelen..."] }` so the admin can see partial failures.

### 3.3 "Sold Out" Admin Toggle (Priority: LOW -- Recently Implemented)

**Finding:** The "Elfogyott" toggle was just added to `WeeklyMenuGrid.tsx`. This sets `remaining_portions = 0`. However, staff users on the `StaffOrders` page cannot currently mark items as sold out.

**Proposed Solution:** Add a small "Készlet" panel to the staff layout showing today's daily items with sold-out toggles.

---

## Pillar 4: Client-Side UI/UX

### 4.1 "Sold Out" Visual States (Priority: MEDIUM)

**Finding:** In `DailyItemSelector.tsx`:
- The "Elfogyott" badge uses `variant="destructive"` (line 194-195) -- good contrast
- The button is correctly disabled when `remaining_portions <= 0` (line 325)
- However, individual item checkboxes are NOT disabled when sold out -- users can still select items then hit a disabled button, which is confusing

**Proposed Solution:**
- Disable all checkboxes when `remaining_portions <= 0`
- Add `opacity-50 pointer-events-none` to the entire card when sold out
- Show the remaining portions count more prominently (e.g., progress bar)

### 4.2 Mobile Touch Targets (Priority: LOW)

**Finding:** `MobileBottomNav.tsx` uses `h-14` (56px) height with `h-5 w-5` icons and `text-[10px]` labels. The touch targets are the full flex-1 width of each tab, which is adequate. The Sheet trigger button has the same sizing.

**Minor issues:**
- The "More" sheet links have `py-3` padding (approx 44px height) -- meets the 44px minimum
- The `text-[10px]` labels may be too small for some users

**Proposed Solution:** Increase label text to `text-[11px]` and ensure minimum 48px touch targets on all interactive elements.

### 4.3 DailyMenuPanel Responsiveness (Priority: LOW)

**Finding:** Uses responsive grid (`grid-cols-2 gap-3 md:gap-4`) and responsive padding. Image aspect ratio changes between mobile/desktop (`aspect-[4/3] md:aspect-[16/9]`). The CTA button has `h-12` which is good for mobile.

**No critical issues found.** Minor suggestion: add `scroll-margin-top` so navigating to this section doesn't hide content behind the sticky nav.

---

## Pillar 5: Future-Proofing

### 5.1 Real-time WebSocket Notifications (Priority: LOW -- Already Implemented)

**Finding:** The system ALREADY has a robust real-time notification architecture:
- `useGlobalOrderNotifications.tsx`: Supabase Realtime `postgres_changes` subscription for INSERT events on the `orders` table
- Exponential backoff retry (up to 5 retries)
- Auth token synchronization on JWT refresh
- Audio notification with Web Audio API
- Known-order-ID deduplication via `knownOrderIdsRef`
- Global context via `OrderNotificationsProvider` in `App.tsx`

**Assessment:** This is production-quality. No changes needed for the current feature set.

**For future "customer sees real-time stock updates":**
- Subscribe to `daily_offers` table changes (UPDATE on `remaining_portions`)
- Debounce UI updates to avoid flicker during rush periods
- Consider a "polling fallback" for browsers that lose WebSocket connections

### 5.2 Cutoff Time System (Priority: MEDIUM -- Mentioned in Docs)

**Finding:** No cutoff time logic exists. The system only prevents ordering for past dates, not "it's 2pm, you can no longer order today's menu."

**Proposed Solution:** Add a `cutoff_time` column to `daily_offers` (e.g., `'14:00'`), or a global setting in the `settings` table. The edge function and Checkout UI should check this before allowing orders for today's daily items.

---

## Summary Table

| # | Issue | Priority | Status |
|---|-------|----------|--------|
| 1.2 | Capacity slot race condition (no FOR UPDATE) | CRITICAL | Open |
| 1.1 | Capacity + portions not transactionally linked | HIGH | Open |
| 1.3 | No rollback on partial order failure | HIGH | Open |
| 2.4 | Modifier/side prices not server-validated | MEDIUM | Open |
| 2.1 | ASAP orders bypass business-hours DB check | MEDIUM | Open |
| 3.1 | Order status workflow could be faster | MEDIUM | Open |
| 3.2 | Silent failures on modifier/side inserts | MEDIUM | Open |
| 4.1 | Sold-out items still selectable via checkboxes | MEDIUM | Open |
| 5.2 | No cutoff time system for daily orders | MEDIUM | Open |
| 1.4 | 61 migration files (sprawl) | LOW | Acceptable |
| 2.2 | Orders RLS | LOW | Secure |
| 2.3 | Edge function secrets | LOW | Secure |
| 3.3 | Staff sold-out toggle missing | LOW | Open |
| 4.2 | Mobile touch targets slightly small | LOW | Acceptable |
| 4.3 | DailyMenuPanel responsive | LOW | Good |
| 5.1 | Real-time notifications | LOW | Already done |

---

## Recommended Implementation Order

1. **Fix capacity slot race condition** (Critical -- 1.2)
2. **Add modifier/side price server validation** (Medium security -- 2.4)
3. **Restructure submit-order for atomic operations** (High -- 1.1, 1.3)
4. **Disable sold-out item checkboxes on frontend** (Medium UX -- 4.1)
5. **Add cutoff time system** (Medium feature -- 5.2)
6. **Improve order status workflow** (Medium UX -- 3.1)
