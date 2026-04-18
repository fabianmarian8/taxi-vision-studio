-- Migration: Prevent duplicate approved drafts per partner
-- Date: 2026-04-18
-- Reason: Royal Taxi had two 'approved' drafts simultaneously — older full draft and newer
--   partial (hero-only) draft. get_approved_partner_data returned the partial one, wiping
--   phone/description/services/gallery from the public page. Root cause: publish_partner_draft_with_audit
--   set one draft to 'approved' without cleaning up previous approved drafts.

-- 1) Updated publish function: delete older approved drafts + merge missing fields from them.
--    Paying and free partners alike go through this path — there is no admin review step.
CREATE OR REPLACE FUNCTION publish_partner_draft_with_audit(
  p_draft_id UUID,
  p_partner_id UUID,
  p_user_id UUID,
  p_user_email TEXT,
  p_ip_address TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated_at TIMESTAMPTZ;
  v_old_data JSONB;
  v_new_data JSONB;
  v_changed_fields JSONB;
  v_previous_approved RECORD;
BEGIN
  -- Old snapshot for audit
  SELECT to_jsonb(d.*) INTO v_old_data
  FROM partner_drafts d
  WHERE d.id = p_draft_id AND d.partner_id = p_partner_id;

  IF v_old_data IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Draft not found');
  END IF;

  SET LOCAL audit.skip_trigger = 'true';

  -- Pick the most recent already-approved draft (if any) for this partner, except the one we are publishing
  SELECT * INTO v_previous_approved
  FROM partner_drafts
  WHERE partner_id = p_partner_id
    AND status = 'approved'
    AND id <> p_draft_id
  ORDER BY reviewed_at DESC NULLS LAST, updated_at DESC
  LIMIT 1;

  -- Merge: copy non-null fields from previous approved into current draft where current draft has NULL.
  -- This preserves data when a partner publishes a partial edit (e.g. only changed the hero image).
  IF v_previous_approved.id IS NOT NULL THEN
    UPDATE partner_drafts AS d
    SET
      company_name          = COALESCE(d.company_name, v_previous_approved.company_name),
      description           = COALESCE(d.description, v_previous_approved.description),
      show_description      = COALESCE(d.show_description, v_previous_approved.show_description),
      phone                 = COALESCE(d.phone, v_previous_approved.phone),
      email                 = COALESCE(d.email, v_previous_approved.email),
      website               = COALESCE(d.website, v_previous_approved.website),
      hero_title            = COALESCE(d.hero_title, v_previous_approved.hero_title),
      hero_subtitle         = COALESCE(d.hero_subtitle, v_previous_approved.hero_subtitle),
      hero_image_url        = COALESCE(d.hero_image_url, v_previous_approved.hero_image_url),
      hero_image_zoom       = COALESCE(d.hero_image_zoom, v_previous_approved.hero_image_zoom),
      hero_image_pos_x      = COALESCE(d.hero_image_pos_x, v_previous_approved.hero_image_pos_x),
      hero_image_pos_y      = COALESCE(d.hero_image_pos_y, v_previous_approved.hero_image_pos_y),
      services              = COALESCE(d.services, v_previous_approved.services),
      show_services         = COALESCE(d.show_services, v_previous_approved.show_services),
      services_description  = COALESCE(d.services_description, v_previous_approved.services_description),
      gallery               = COALESCE(d.gallery, v_previous_approved.gallery),
      social_facebook       = COALESCE(d.social_facebook, v_previous_approved.social_facebook),
      social_instagram      = COALESCE(d.social_instagram, v_previous_approved.social_instagram),
      whatsapp              = COALESCE(d.whatsapp, v_previous_approved.whatsapp),
      booking_url           = COALESCE(d.booking_url, v_previous_approved.booking_url),
      pricelist_url         = COALESCE(d.pricelist_url, v_previous_approved.pricelist_url),
      transport_rules_url   = COALESCE(d.transport_rules_url, v_previous_approved.transport_rules_url),
      contact_url           = COALESCE(d.contact_url, v_previous_approved.contact_url),
      template_variant      = COALESCE(d.template_variant, v_previous_approved.template_variant)
    WHERE d.id = p_draft_id;

    -- Drop old approved drafts so only one remains. We must delete BEFORE promoting the new one
    -- to avoid conflict with the partial unique index added below.
    DELETE FROM partner_drafts
    WHERE partner_id = p_partner_id
      AND status = 'approved'
      AND id <> p_draft_id;
  END IF;

  -- Promote the target draft to approved
  UPDATE partner_drafts
  SET
    status = 'approved',
    submitted_at = NOW(),
    reviewed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_draft_id
    AND partner_id = p_partner_id
  RETURNING updated_at INTO v_updated_at;

  -- New snapshot
  SELECT to_jsonb(d.*) INTO v_new_data
  FROM partner_drafts d
  WHERE d.id = p_draft_id;

  -- Changed fields diff
  SELECT jsonb_object_agg(key, value) INTO v_changed_fields
  FROM jsonb_each(v_new_data)
  WHERE NOT v_old_data ? key
     OR v_old_data->key IS DISTINCT FROM value;

  -- Audit entry
  INSERT INTO audit.activity_log (
    table_schema, table_name, operation, user_id, user_email,
    ip_address, old_data, new_data, changed_fields
  ) VALUES (
    'public', 'partner_drafts', 'UPDATE', p_user_id, p_user_email,
    p_ip_address, v_old_data, v_new_data, v_changed_fields
  );

  RETURN jsonb_build_object(
    'success', true,
    'draft_id', p_draft_id,
    'updated_at', v_updated_at,
    'merged_from_previous', v_previous_approved.id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION publish_partner_draft_with_audit TO authenticated;
GRANT EXECUTE ON FUNCTION publish_partner_draft_with_audit TO service_role;

-- 2) DB-level guarantee: at most one approved draft per partner.
CREATE UNIQUE INDEX IF NOT EXISTS partner_drafts_one_approved_per_partner
  ON partner_drafts (partner_id)
  WHERE status = 'approved';
