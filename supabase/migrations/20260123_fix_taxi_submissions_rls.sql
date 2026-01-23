-- Fix RLS policy for taxi_submissions
-- Allow anyone to read APPROVED submissions (needed for public city pages)
-- Keep authenticated-only for pending/rejected

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Authenticated users can read taxi submissions" ON taxi_submissions;

-- Create new policy: anyone can read approved submissions
CREATE POLICY "Anyone can read approved taxi submissions"
  ON taxi_submissions FOR SELECT
  USING (status = 'approved');

-- Create new policy: authenticated users can read all submissions (for admin panel)
CREATE POLICY "Authenticated users can read all taxi submissions"
  ON taxi_submissions FOR SELECT
  USING (auth.role() = 'authenticated');
