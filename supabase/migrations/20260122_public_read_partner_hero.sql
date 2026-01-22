-- Migration: Public read access for partner hero images
-- Date: 2026-01-22
-- Purpose: Allow public pages to read partner slugs and approved hero images
--          without using service role key
--
-- IMPORTANT: Run this BEFORE deploying the page.tsx change!
--
-- ROLLBACK:
--   DROP POLICY IF EXISTS "public_read_partner_slugs" ON partners;
--   DROP POLICY IF EXISTS "public_read_approved_hero" ON partner_drafts;

-- 1. Check if RLS is enabled on partners table
-- If not, enable it (but this might break existing queries!)
-- ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

-- 2. Policy for partners table - allow reading slug and id
-- This allows public pages to look up partner by slug
CREATE POLICY "public_read_partner_slugs" ON partners
  FOR SELECT
  USING (true);

-- 3. Policy for partner_drafts - allow reading approved drafts only
-- This allows public pages to get hero_image_url for display
CREATE POLICY "public_read_approved_hero" ON partner_drafts
  FOR SELECT
  USING (status = 'approved');

-- NOTE: These policies allow reading ALL columns. If you want to restrict
-- to specific columns, you need to create a VIEW instead:
--
-- CREATE VIEW public_partner_info AS
--   SELECT slug, id FROM partners;
--
-- CREATE VIEW public_partner_hero AS
--   SELECT partner_id, hero_image_url
--   FROM partner_drafts
--   WHERE status = 'approved';
