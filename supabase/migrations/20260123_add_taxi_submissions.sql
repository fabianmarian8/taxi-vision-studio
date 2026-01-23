-- Tabuľka pre návrhy nových taxislužieb od používateľov
CREATE TABLE IF NOT EXISTS taxi_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_slug TEXT NOT NULL,
  city_name TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  description TEXT,
  ico TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  notes TEXT -- interné poznámky admina
);

-- Index pre rýchle filtrovanie podľa statusu
CREATE INDEX IF NOT EXISTS idx_taxi_submissions_status ON taxi_submissions(status);

-- Index pre rýchle filtrovanie podľa mesta
CREATE INDEX IF NOT EXISTS idx_taxi_submissions_city ON taxi_submissions(city_slug);

-- RLS politiky
ALTER TABLE taxi_submissions ENABLE ROW LEVEL SECURITY;

-- Ktokoľvek môže vložiť nový návrh
CREATE POLICY "Anyone can insert taxi submissions"
  ON taxi_submissions FOR INSERT
  WITH CHECK (true);

-- Iba autentifikovaní používatelia (admini) môžu čítať
CREATE POLICY "Authenticated users can read taxi submissions"
  ON taxi_submissions FOR SELECT
  USING (auth.role() = 'authenticated');

-- Iba autentifikovaní používatelia môžu upravovať
CREATE POLICY "Authenticated users can update taxi submissions"
  ON taxi_submissions FOR UPDATE
  USING (auth.role() = 'authenticated');
