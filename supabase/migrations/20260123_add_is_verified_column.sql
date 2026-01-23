-- Add is_verified column to taxi_services
-- Mini plan sets is_verified = true (badge only)
-- Premium sets is_verified + is_premium (badge + highlighted)
-- Partner sets all flags

ALTER TABLE taxi_services
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- Set existing premium/partner services as verified
UPDATE taxi_services
SET is_verified = TRUE
WHERE is_premium = TRUE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_taxi_services_is_verified
ON taxi_services(is_verified);

-- Add comment
COMMENT ON COLUMN taxi_services.is_verified IS 'True if taxi service has paid for verification (Mini, Premium, or Partner plan)';
