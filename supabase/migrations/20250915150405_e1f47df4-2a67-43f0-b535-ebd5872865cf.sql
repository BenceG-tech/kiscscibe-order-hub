-- Create daily_offer_templates table
CREATE TABLE public.daily_offer_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  menu_config jsonb, -- For soup and main course configuration
  default_price_huf integer,
  default_max_portions integer DEFAULT 30,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  usage_count integer NOT NULL DEFAULT 0,
  last_used_at timestamp with time zone,
  tags text[] DEFAULT '{}'::text[]
);

-- Enable RLS
ALTER TABLE public.daily_offer_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin access
CREATE POLICY "Admin can view all templates" 
ON public.daily_offer_templates 
FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY "Admin can create templates" 
ON public.daily_offer_templates 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admin can update templates" 
ON public.daily_offer_templates 
FOR UPDATE 
USING (is_admin(auth.uid()));

CREATE POLICY "Admin can delete templates" 
ON public.daily_offer_templates 
FOR DELETE 
USING (is_admin(auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_daily_offer_templates_name ON public.daily_offer_templates(name);
CREATE INDEX idx_daily_offer_templates_created_by ON public.daily_offer_templates(created_by);
CREATE INDEX idx_daily_offer_templates_active ON public.daily_offer_templates(is_active);
CREATE INDEX idx_daily_offer_templates_tags ON public.daily_offer_templates USING GIN(tags);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_daily_offer_templates_updated_at
BEFORE UPDATE ON public.daily_offer_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to increment usage count
CREATE OR REPLACE FUNCTION public.increment_template_usage(template_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE daily_offer_templates 
  SET 
    usage_count = usage_count + 1,
    last_used_at = now()
  WHERE id = template_id;
END;
$$;