-- 1) Allow status + rating email types in the send log
ALTER TABLE public.email_send_log DROP CONSTRAINT IF EXISTS email_send_log_email_type_check;
ALTER TABLE public.email_send_log ADD CONSTRAINT email_send_log_email_type_check
  CHECK (email_type IN (
    'admin_notification',
    'customer_confirmation',
    'status_preparing',
    'status_ready',
    'status_completed',
    'rating_request'
  ));

-- 2) Fix visible typo in the About page content
UPDATE public.settings
SET value_json = replace(value_json::text, 'Házias ízek, újragondolvaaaa', 'Házias ízek, újragondolva')::jsonb
WHERE key = 'about_page'
  AND value_json::text LIKE '%Házias ízek, újragondolvaaaa%';

-- 3) Remove existing duplicate daily-offer items (keep the oldest row of each pair)
DELETE FROM public.daily_offer_items a
USING public.daily_offer_items b
WHERE a.daily_offer_id = b.daily_offer_id
  AND a.item_id = b.item_id
  AND a.ctid > b.ctid;

-- 4) Prevent the same item being added twice to the same day
CREATE UNIQUE INDEX IF NOT EXISTS daily_offer_items_offer_item_uniq
  ON public.daily_offer_items (daily_offer_id, item_id);