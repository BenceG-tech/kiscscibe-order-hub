
-- invoices table
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'incoming',
  status text NOT NULL DEFAULT 'draft',
  invoice_number text,
  partner_name text NOT NULL,
  partner_tax_id text,
  order_id uuid REFERENCES public.orders(id),
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  payment_date date,
  net_amount integer NOT NULL DEFAULT 0,
  vat_amount integer NOT NULL DEFAULT 0,
  gross_amount integer NOT NULL DEFAULT 0,
  vat_rate integer NOT NULL DEFAULT 27,
  category text NOT NULL DEFAULT 'other',
  notes text,
  file_urls text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

-- invoice_items table
CREATE TABLE public.invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit text NOT NULL DEFAULT 'db',
  unit_price integer NOT NULL DEFAULT 0,
  line_total integer NOT NULL DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for invoices (admin only)
CREATE POLICY "Admin can view invoices" ON public.invoices FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Admin can insert invoices" ON public.invoices FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admin can update invoices" ON public.invoices FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "Admin can delete invoices" ON public.invoices FOR DELETE USING (is_admin(auth.uid()));

-- RLS policies for invoice_items (admin only)
CREATE POLICY "Admin can view invoice items" ON public.invoice_items FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Admin can insert invoice items" ON public.invoice_items FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admin can update invoice items" ON public.invoice_items FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "Admin can delete invoice items" ON public.invoice_items FOR DELETE USING (is_admin(auth.uid()));

-- updated_at trigger for invoices
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for invoice files (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('invoices', 'invoices', false);

-- Storage RLS policies
CREATE POLICY "Admin can upload invoice files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'invoices' AND is_admin(auth.uid()));
CREATE POLICY "Admin can view invoice files" ON storage.objects FOR SELECT USING (bucket_id = 'invoices' AND is_admin(auth.uid()));
CREATE POLICY "Admin can delete invoice files" ON storage.objects FOR DELETE USING (bucket_id = 'invoices' AND is_admin(auth.uid()));
CREATE POLICY "Admin can update invoice files" ON storage.objects FOR UPDATE USING (bucket_id = 'invoices' AND is_admin(auth.uid()));
