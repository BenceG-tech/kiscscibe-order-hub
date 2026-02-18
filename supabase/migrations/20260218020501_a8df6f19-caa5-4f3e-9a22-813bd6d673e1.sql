
-- Create partners table
CREATE TABLE public.partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  short_name text,
  tax_number text,
  eu_vat_number text,
  address text,
  postal_code text,
  city text,
  contact_name text,
  contact_email text,
  contact_phone text,
  payment_terms text DEFAULT 'net_15',
  bank_name text,
  bank_iban text,
  category text DEFAULT 'other',
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- RLS policies for partners (admin-only)
CREATE POLICY "Admin can view partners"
  ON public.partners FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admin can insert partners"
  ON public.partners FOR INSERT WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admin can update partners"
  ON public.partners FOR UPDATE USING (is_admin(auth.uid()));

CREATE POLICY "Admin can delete partners"
  ON public.partners FOR DELETE USING (is_admin(auth.uid()));

-- updated_at trigger for partners
CREATE TRIGGER partners_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add partner_id FK to invoices table
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS partner_id uuid REFERENCES public.partners(id) ON DELETE SET NULL;
