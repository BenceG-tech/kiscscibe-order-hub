-- Create gallery_images table
CREATE TABLE public.gallery_images (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url text NOT NULL,
  alt_text text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

-- Public can read active images
CREATE POLICY "Gallery images are publicly readable"
  ON public.gallery_images FOR SELECT
  USING (is_active = true);

-- Admins can view all
CREATE POLICY "Admins can view all gallery images"
  ON public.gallery_images FOR SELECT
  USING (is_admin(auth.uid()));

-- Admins can insert
CREATE POLICY "Admins can insert gallery images"
  ON public.gallery_images FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

-- Admins can update
CREATE POLICY "Admins can update gallery images"
  ON public.gallery_images FOR UPDATE
  USING (is_admin(auth.uid()));

-- Admins can delete
CREATE POLICY "Admins can delete gallery images"
  ON public.gallery_images FOR DELETE
  USING (is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_gallery_images_updated_at
  BEFORE UPDATE ON public.gallery_images
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();