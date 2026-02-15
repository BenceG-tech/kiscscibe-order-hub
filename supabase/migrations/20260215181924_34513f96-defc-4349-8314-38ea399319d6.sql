
-- Create trigger function to auto-create invoice when order is completed
CREATE OR REPLACE FUNCTION public.create_invoice_on_order_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_count integer;
  vat_rate_val integer := 27;
  net_val integer;
  vat_val integer;
BEGIN
  -- Only fire when status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    -- Check for duplicate
    SELECT COUNT(*) INTO existing_count
    FROM invoices
    WHERE order_id = NEW.id;

    IF existing_count = 0 THEN
      net_val := ROUND(NEW.total_huf / (1.0 + vat_rate_val / 100.0));
      vat_val := NEW.total_huf - net_val;

      INSERT INTO invoices (
        type, status, partner_name, gross_amount, net_amount, vat_amount,
        vat_rate, category, issue_date, order_id, invoice_number
      ) VALUES (
        'order_receipt', 'paid', NEW.name, NEW.total_huf, net_val, vat_val,
        vat_rate_val, 'food_sale', CURRENT_DATE, NEW.id, NEW.code
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Attach trigger to orders table
CREATE TRIGGER trg_create_invoice_on_order_complete
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.create_invoice_on_order_complete();
