-- Fix RLS for hidden_taxi_services
-- Allow anyone to READ hidden services (needed for server-side filtering)
-- Keep authenticated-only for INSERT/DELETE

-- Drop the old restrictive SELECT policy
DROP POLICY IF EXISTS "Authenticated users can read hidden taxi services" ON hidden_taxi_services;

-- Create new policy: anyone can read hidden services (for filtering on public pages)
CREATE POLICY "Anyone can read hidden taxi services"
  ON hidden_taxi_services FOR SELECT
  USING (true);
