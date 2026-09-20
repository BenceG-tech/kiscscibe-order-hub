# Pending (deliberately unapplied) migrations

SQL in this folder is **not** applied yet. It is staged here because applying it
before the current preview is published would break the *published* production
build, which still contains the old code.

## Required ordering

`20260920_revoke_get_customer_orders.sql`

1. Preview contains the rewritten `OrderHistoryLookup` (order code + phone via
   `get_customer_order_secure`). The published build still calls
   `get_customer_orders(text)` with phone only.
2. **Publish this preview first.**
3. **Only then** apply `20260920_revoke_get_customer_orders.sql` (move it into
   `supabase/migrations/` and run it).

Applying it earlier would make the live "order history" lookup fail with
`permission denied for function get_customer_orders`.
