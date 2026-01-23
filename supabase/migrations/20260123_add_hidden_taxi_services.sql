-- Tabuľka pre skrytie taxislužieb (JSON služby aj submissions)
-- Superadmin môže označiť službu ako skrytú
CREATE TABLE IF NOT EXISTS hidden_taxi_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_slug TEXT NOT NULL,
  service_name TEXT NOT NULL,
  hidden_by TEXT NOT NULL,
  hidden_at TIMESTAMPTZ DEFAULT NOW(),
  reason TEXT,
  -- Unique constraint to prevent duplicates
  UNIQUE(city_slug, service_name)
);

-- Index pre rýchle vyhľadávanie podľa mesta
CREATE INDEX IF NOT EXISTS idx_hidden_taxi_services_city ON hidden_taxi_services(city_slug);

-- RLS politiky
ALTER TABLE hidden_taxi_services ENABLE ROW LEVEL SECURITY;

-- Iba autentifikovaní používatelia môžu čítať
CREATE POLICY "Authenticated users can read hidden taxi services"
  ON hidden_taxi_services FOR SELECT
  USING (auth.role() = 'authenticated');

-- Iba autentifikovaní používatelia môžu vkladať
CREATE POLICY "Authenticated users can insert hidden taxi services"
  ON hidden_taxi_services FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Iba autentifikovaní používatelia môžu mazať
CREATE POLICY "Authenticated users can delete hidden taxi services"
  ON hidden_taxi_services FOR DELETE
  USING (auth.role() = 'authenticated');
