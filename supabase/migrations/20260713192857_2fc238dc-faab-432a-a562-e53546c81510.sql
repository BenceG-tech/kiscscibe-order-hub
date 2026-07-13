
CREATE TABLE public.email_send_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  email_type text NOT NULL CHECK (email_type IN ('admin_notification','customer_confirmation')),
  recipient text NOT NULL,
  status text NOT NULL CHECK (status IN ('sent','failed','skipped')),
  resend_message_id text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.email_send_log TO authenticated;
GRANT ALL ON public.email_send_log TO service_role;

ALTER TABLE public.email_send_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_staff_read_email_log"
  ON public.email_send_log FOR SELECT
  TO authenticated
  USING (public.is_admin_or_staff(auth.uid()));

CREATE INDEX idx_email_send_log_order ON public.email_send_log(order_id, created_at DESC);

-- Cleanup #L69199 test order
DELETE FROM public.order_item_options WHERE order_item_id IN
  (SELECT id FROM public.order_items WHERE order_id =
    (SELECT id FROM public.orders WHERE code = 'L69199'));
DELETE FROM public.order_items WHERE order_id =
  (SELECT id FROM public.orders WHERE code = 'L69199');
DELETE FROM public.invoices WHERE order_id =
  (SELECT id FROM public.orders WHERE code = 'L69199');
DELETE FROM public.orders WHERE code = 'L69199';
