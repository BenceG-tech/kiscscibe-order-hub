
-- Create recurring_invoices table
CREATE TABLE public.recurring_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_name text NOT NULL,
  partner_tax_id text,
  category text NOT NULL DEFAULT 'rent',
  gross_amount integer NOT NULL,
  vat_rate integer NOT NULL DEFAULT 27,
  net_amount integer NOT NULL,
  vat_amount integer NOT NULL,
  frequency text NOT NULL DEFAULT 'monthly',
  day_of_month integer NOT NULL DEFAULT 1,
  next_due_date date NOT NULL,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

-- Enable RLS
ALTER TABLE public.recurring_invoices ENABLE ROW LEVEL SECURITY;

-- Admin-only CRUD policies
CREATE POLICY "Admin can view recurring invoices"
  ON public.recurring_invoices FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admin can insert recurring invoices"
  ON public.recurring_invoices FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admin can update recurring invoices"
  ON public.recurring_invoices FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "Admin can delete recurring invoices"
  ON public.recurring_invoices FOR DELETE
  USING (is_admin(auth.uid()));
