-- Add gallery_type column to distinguish between food and interior galleries
ALTER TABLE public.gallery_images 
ADD COLUMN gallery_type TEXT NOT NULL DEFAULT 'food';

-- Add check constraint for gallery_type
ALTER TABLE public.gallery_images 
ADD CONSTRAINT gallery_images_gallery_type_check 
CHECK (gallery_type IN ('food', 'interior'));

-- Add title column for image titles
ALTER TABLE public.gallery_images 
ADD COLUMN title TEXT;