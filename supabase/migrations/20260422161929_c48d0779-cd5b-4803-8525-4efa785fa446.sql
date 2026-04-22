ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS exclude_from_reports boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_extracted boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_confidence text,
ADD COLUMN IF NOT EXISTS ai_reviewed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS ai_reviewed_by uuid;

CREATE INDEX IF NOT EXISTS idx_invoices_reporting_flags
ON public.invoices (is_test, exclude_from_reports, ai_extracted);

UPDATE public.invoices
SET is_test = true,
    exclude_from_reports = true
WHERE type = 'order_receipt'
  AND lower(partner_name) IN ('bence gatai', 'gátai bence', 'bence gátai');

CREATE OR REPLACE FUNCTION public.set_invoice_test_exclusion()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.is_test = true THEN
    NEW.exclude_from_reports = true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_invoice_test_exclusion_trigger ON public.invoices;
CREATE TRIGGER set_invoice_test_exclusion_trigger
BEFORE INSERT OR UPDATE OF is_test ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.set_invoice_test_exclusion();

DROP TRIGGER IF EXISTS audit_invoices_trigger ON public.invoices;
CREATE TRIGGER audit_invoices_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

DROP TRIGGER IF EXISTS audit_invoice_items_trigger ON public.invoice_items;
CREATE TRIGGER audit_invoice_items_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.invoice_items
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

DROP TRIGGER IF EXISTS audit_recurring_invoices_trigger ON public.recurring_invoices;
CREATE TRIGGER audit_recurring_invoices_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.recurring_invoices
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

DROP TRIGGER IF EXISTS audit_partners_trigger ON public.partners;
CREATE TRIGGER audit_partners_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.partners
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

DROP TRIGGER IF EXISTS audit_documents_trigger ON public.documents;
CREATE TRIGGER audit_documents_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.documents
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

DROP TRIGGER IF EXISTS audit_daily_offers_trigger ON public.daily_offers;
CREATE TRIGGER audit_daily_offers_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.daily_offers
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

DROP TRIGGER IF EXISTS audit_daily_offer_items_trigger ON public.daily_offer_items;
CREATE TRIGGER audit_daily_offer_items_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.daily_offer_items
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

DROP TRIGGER IF EXISTS audit_menu_items_trigger ON public.menu_items;
CREATE TRIGGER audit_menu_items_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.menu_items
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

DROP TRIGGER IF EXISTS audit_settings_trigger ON public.settings;
CREATE TRIGGER audit_settings_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.settings
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();