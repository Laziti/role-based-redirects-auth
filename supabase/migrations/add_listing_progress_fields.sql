-- Add new columns to listings table
ALTER TABLE listings
ADD COLUMN progress_status text CHECK (progress_status IN ('excavation', 'on_progress', 'semi_finished', 'fully_finished')),
ADD COLUMN down_payment_percent numeric,
ADD COLUMN bank_option boolean DEFAULT false,
ADD COLUMN city text;

-- Add comment to explain the progress_status values
COMMENT ON COLUMN listings.progress_status IS 'Status of the property construction: excavation (ቁፋሮ), on_progress, semi_finished, fully_finished';
COMMENT ON COLUMN listings.city IS 'City where the property is located'; 