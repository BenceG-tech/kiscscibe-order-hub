-- 1) Dedupe abandoned_carts by session_id keeping newest
DELETE FROM public.abandoned_carts a
USING public.abandoned_carts b
WHERE a.session_id = b.session_id
  AND a.last_activity_at < b.last_activity_at;

-- 2) Unique index so upsert(on_conflict: 'session_id') actually dedupes
CREATE UNIQUE INDEX IF NOT EXISTS abandoned_carts_session_id_uniq
  ON public.abandoned_carts (session_id);

-- 3) Partial unique index on orders.idempotency_key so retries collapse to one order
CREATE UNIQUE INDEX IF NOT EXISTS orders_idempotency_key_uniq
  ON public.orders (idempotency_key)
  WHERE idempotency_key IS NOT NULL;