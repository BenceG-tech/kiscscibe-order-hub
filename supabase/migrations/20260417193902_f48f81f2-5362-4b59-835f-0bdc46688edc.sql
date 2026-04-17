-- Document folders
CREATE TABLE public.document_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL DEFAULT '#F6C22D',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.document_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/staff can view folders" ON public.document_folders FOR SELECT USING (is_admin_or_staff(auth.uid()));
CREATE POLICY "Admin/staff can insert folders" ON public.document_folders FOR INSERT WITH CHECK (is_admin_or_staff(auth.uid()));
CREATE POLICY "Admin/staff can update folders" ON public.document_folders FOR UPDATE USING (is_admin_or_staff(auth.uid()));
CREATE POLICY "Admin/staff can delete folders" ON public.document_folders FOR DELETE USING (is_admin_or_staff(auth.uid()));

-- Document tags
CREATE TABLE public.document_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  color text NOT NULL DEFAULT '#F6C22D',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.document_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/staff can view tags" ON public.document_tags FOR SELECT USING (is_admin_or_staff(auth.uid()));
CREATE POLICY "Admin/staff can insert tags" ON public.document_tags FOR INSERT WITH CHECK (is_admin_or_staff(auth.uid()));
CREATE POLICY "Admin/staff can update tags" ON public.document_tags FOR UPDATE USING (is_admin_or_staff(auth.uid()));
CREATE POLICY "Admin/staff can delete tags" ON public.document_tags FOR DELETE USING (is_admin_or_staff(auth.uid()));

-- Documents
CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  original_filename text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  mime_type text,
  folder_id uuid REFERENCES public.document_folders(id) ON DELETE SET NULL,
  tags text[] NOT NULL DEFAULT '{}',
  description text,
  is_starred boolean NOT NULL DEFAULT false,
  version integer NOT NULL DEFAULT 1,
  parent_document_id uuid REFERENCES public.documents(id) ON DELETE CASCADE,
  is_latest_version boolean NOT NULL DEFAULT true,
  uploaded_by uuid,
  uploaded_by_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_documents_folder ON public.documents(folder_id);
CREATE INDEX idx_documents_parent ON public.documents(parent_document_id);
CREATE INDEX idx_documents_latest ON public.documents(is_latest_version);
CREATE INDEX idx_documents_tags ON public.documents USING GIN(tags);

CREATE POLICY "Admin/staff can view documents" ON public.documents FOR SELECT USING (is_admin_or_staff(auth.uid()));
CREATE POLICY "Admin/staff can insert documents" ON public.documents FOR INSERT WITH CHECK (is_admin_or_staff(auth.uid()));
CREATE POLICY "Admin/staff can update documents" ON public.documents FOR UPDATE USING (is_admin_or_staff(auth.uid()));
CREATE POLICY "Admin/staff can delete documents" ON public.documents FOR DELETE USING (is_admin_or_staff(auth.uid()));

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Activity log
CREATE TABLE public.document_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid,
  action text NOT NULL,
  user_id uuid,
  user_name text,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.document_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/staff can view activity" ON public.document_activity FOR SELECT USING (is_admin_or_staff(auth.uid()));
CREATE POLICY "Admin/staff can insert activity" ON public.document_activity FOR INSERT WITH CHECK (is_admin_or_staff(auth.uid()));

-- Storage bucket (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admin/staff can view document files" ON storage.objects FOR SELECT USING (bucket_id = 'documents' AND is_admin_or_staff(auth.uid()));
CREATE POLICY "Admin/staff can upload document files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents' AND is_admin_or_staff(auth.uid()));
CREATE POLICY "Admin/staff can update document files" ON storage.objects FOR UPDATE USING (bucket_id = 'documents' AND is_admin_or_staff(auth.uid()));
CREATE POLICY "Admin/staff can delete document files" ON storage.objects FOR DELETE USING (bucket_id = 'documents' AND is_admin_or_staff(auth.uid()));