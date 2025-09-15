-- Add per-item portion management to daily offer items
ALTER TABLE daily_offer_items 
ADD COLUMN portions_needed integer DEFAULT 1 NOT NULL;

-- Add comment for clarity
COMMENT ON COLUMN daily_offer_items.portions_needed IS 'Number of portions needed for this specific item in the daily offer';