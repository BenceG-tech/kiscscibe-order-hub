-- Add display_order to menu_items
ALTER TABLE public.menu_items
ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_menu_items_category_display_order
ON public.menu_items (category_id, display_order);

-- Backfill display_order within each category, alphabetical
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY name) AS rn
  FROM public.menu_items
)
UPDATE public.menu_items mi
SET display_order = o.rn
FROM ordered o
WHERE mi.id = o.id AND mi.display_order = 0;

-- Public read policy for always_available_display setting
CREATE POLICY "Public can read always available display settings"
ON public.settings
FOR SELECT
USING (key = 'always_available_display');
