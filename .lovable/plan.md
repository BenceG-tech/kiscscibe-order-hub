## Plan: Address Fix + Live Overlay Test

### 1. Address Replacement (BACKLOG-2d)

Replace placeholder `📍 1145 Budapest, Vezér utca 12.` with `📍 1141 Budapest, Vezér u. 110.` in exactly three files:

- `supabase/functions/send-welcome-newsletter/index.ts` (line ~82)
- `supabase/functions/send-weekly-menu/index.ts` (line ~131)
- `supabase/functions/send-contact-email/index.ts` (line ~118)

No other logic touched. Edge functions auto-deploy.

### 2. Live Overlay Test — Coordinated with User

Since Playwright cannot open an admin session (`external_unmanaged`), we run this together. Flow:

**Waiting state:** After address fix, I stand by and confirm "ready". User opens `/admin/orders` in preview and signals go.

**Insert waves** (via `supabase--insert`, using date-guardable marker `AUDIT TESZT OVERLAY %`):

1. Wave 1 → insert 1 order (`AUDIT TESZT OVERLAY 1`), pickup = tomorrow 12:00, with matching `order_items` row (name_snapshot, unit_price_huf, qty=1, line_total_huf). Wait for user confirmation (~15s) that 1 large centered card + 1 sound heard.
2. Wave 2 → insert 1 more (total 2). User verifies 2-column layout, 2nd sound.
3. Wave 3 → insert 2 more (total 4). User verifies 2×2 grid, 2 more sounds.
4. Wave 4 → insert 6 more (total 10). User verifies scrollable 3×3, 6 more sounds. **Total: 10 orders = 10 sound events.**

Between each wave I pause and wait for the user's "next" signal — no auto-advance.

### 3. Cleanup (on user's "kész" signal)

Strict date-guarded DELETE (`created_at >= '2026-07-13 20:00:00+00'` AND marker match):

```sql
DELETE FROM order_item_options WHERE order_item_id IN (SELECT id FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE name LIKE 'AUDIT TESZT OVERLAY%' AND created_at >= '2026-07-13 20:00:00+00'));
DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE name LIKE 'AUDIT TESZT OVERLAY%' AND created_at >= '2026-07-13 20:00:00+00');
DELETE FROM email_send_log WHERE order_id IS NULL AND created_at >= '2026-07-13 20:00:00+00';
DELETE FROM orders WHERE name LIKE 'AUDIT TESZT OVERLAY%' AND created_at >= '2026-07-13 20:00:00+00';
```

Then confirm `/admin/activity` shows 0 test orders / 0 test attempts via `supabase--read_query` counts.

### 4. Final Report

- Address diff summary (3 files, before/after)
- Overlay test result matrix (1/2/4/10 cards + layout + sound count, as reported by user)
- Cleanup evidence (row counts before/after)
- `email_send_log` real-order evidence preserved

### Ready-check

After the address edits I reply: **"Kész, mehet az 1. INSERT — szólj!"** and wait for the user's go signal before any inserts.  
terv jó, EGY javítással: a 3. lépés takarításából **töröld ezt a sort**:

```
DELETE FROM email_send_log WHERE order_id IS NULL AND created_at >= '2026-07-13 20:00:00+00';
```

Ez kitörölné a ma éjjeli 42 megőrzött bizonyíték-sort (amiket épp azért állítottunk `order_id = NULL`-ra, hogy megmaradjanak)! Ráadásul felesleges is: az overlay-teszt rendelései **direkt DB INSERT-tel** jönnek létre, nem a submit-order-en át — tehát emailt nem küldenek, `email_send_log` sort nem is hoznak létre. Az `email_send_log`-hoz ebben a körben **egyáltalán ne nyúlj**.

Minden más mehet: cím-csere a 3 fájlban, majd ready-jelzés, és várd a „mehet" jelzésemet az 1. INSERT-hez. A hullámok között csak az én „next" jelzésemre lépj tovább, ahogy írtad.

---