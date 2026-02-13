
-- 1. Create capacity_templates table
CREATE TABLE public.capacity_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  slots jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.capacity_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view capacity templates" ON public.capacity_templates FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Admin can insert capacity templates" ON public.capacity_templates FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admin can update capacity templates" ON public.capacity_templates FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "Admin can delete capacity templates" ON public.capacity_templates FOR DELETE USING (is_admin(auth.uid()));

CREATE TRIGGER update_capacity_templates_updated_at
  BEFORE UPDATE ON public.capacity_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Create blackout_dates table
CREATE TABLE public.blackout_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  reason text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.blackout_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Blackout dates are publicly readable" ON public.blackout_dates FOR SELECT USING (true);
CREATE POLICY "Admin can insert blackout dates" ON public.blackout_dates FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admin can update blackout dates" ON public.blackout_dates FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "Admin can delete blackout dates" ON public.blackout_dates FOR DELETE USING (is_admin(auth.uid()));

-- 3. Add buffer_minutes to capacity_slots
ALTER TABLE public.capacity_slots ADD COLUMN buffer_minutes integer NOT NULL DEFAULT 0;

-- 4. Add missing INSERT and DELETE policies to capacity_slots
CREATE POLICY "Admin can insert capacity slots" ON public.capacity_slots FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admin can delete capacity slots" ON public.capacity_slots FOR DELETE USING (is_admin(auth.uid()));

-- 5. Add public read policy for capacity_settings in settings table
CREATE POLICY "Public can read capacity settings" ON public.settings FOR SELECT USING (key = 'capacity_settings');

-- 6. Insert default capacity settings if not exists
INSERT INTO public.settings (key, value_json) 
VALUES ('capacity_settings', '{"default_daily_capacity": 100, "warning_threshold": 80, "time_slots": [{"time":"07:00","capacity":20},{"time":"08:00","capacity":25},{"time":"09:00","capacity":30},{"time":"10:00","capacity":25},{"time":"11:00","capacity":20},{"time":"12:00","capacity":35},{"time":"13:00","capacity":30},{"time":"14:00","capacity":15}]}'::jsonb)
ON CONFLICT (key) DO NOTHING;
