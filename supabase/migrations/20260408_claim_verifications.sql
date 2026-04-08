-- Tabuľka pre OTP verifikáciu telefónnych čísel pri claim flow
CREATE TABLE IF NOT EXISTS claim_verifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  phone text NOT NULL,
  code text NOT NULL,
  city_slug text NOT NULL,
  taxi_service_name text NOT NULL,
  attempts integer DEFAULT 0,
  verified boolean DEFAULT false,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Index pre rýchle vyhľadávanie podľa telefónu
CREATE INDEX idx_claim_verifications_phone ON claim_verifications(phone, verified);

-- Index pre cleanup expired záznamov
CREATE INDEX idx_claim_verifications_expires ON claim_verifications(expires_at);

-- RLS: len server-side prístup (service role)
ALTER TABLE claim_verifications ENABLE ROW LEVEL SECURITY;
