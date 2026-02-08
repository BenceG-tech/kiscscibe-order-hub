
-- Add email column to orders table (nullable for existing orders)
ALTER TABLE public.orders ADD COLUMN email text;

-- Enable realtime for the orders table
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
