-- Drop the existing check constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add updated check constraint with all required status values
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
CHECK (status IN ('new', 'preparing', 'ready', 'completed', 'cancelled'));