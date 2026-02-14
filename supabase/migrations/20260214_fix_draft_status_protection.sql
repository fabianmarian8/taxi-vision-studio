-- Migration: Remove status/submitted_at/reviewed_at from update_partner_draft_with_audit
-- Date: 2026-02-14
-- Purpose: Prevent accidental status changes when saving draft edits.
-- Status changes should ONLY happen through publish_partner_draft_with_audit or admin functions.
-- Root cause: OuKej Taxi draft status was changed from 'approved' to 'draft' during a save,
-- making their published data invisible on the public page.

-- Fix 1: Remove status, submitted_at, reviewed_at from UPDATE function
CREATE OR REPLACE FUNCTION update_partner_draft_with_audit(
  p_draft_id UUID,
  p_partner_id UUID,
  p_changes JSONB,
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
BEGIN
  -- Najprv získame staré dáta pre audit
  SELECT to_jsonb(d.*) INTO v_old_data
  FROM partner_drafts d
  WHERE d.id = p_draft_id AND d.partner_id = p_partner_id;

  IF v_old_data IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Draft not found');
  END IF;

  -- Dočasne deaktivujeme trigger aby sa nespustil dvakrát
  SET LOCAL audit.skip_trigger = 'true';

  -- UPDATE draft - BEZ status/submitted_at/reviewed_at
  -- Tieto polia mení len publish_partner_draft_with_audit alebo admin funkcie
  UPDATE partner_drafts
  SET
    company_name = COALESCE((p_changes->>'company_name'), company_name),
    description = COALESCE((p_changes->>'description'), description),
    show_description = COALESCE((p_changes->>'show_description')::BOOLEAN, show_description),
    phone = COALESCE((p_changes->>'phone'), phone),
    email = COALESCE((p_changes->>'email'), email),
    website = COALESCE((p_changes->>'website'), website),
    hero_title = COALESCE((p_changes->>'hero_title'), hero_title),
    hero_subtitle = COALESCE((p_changes->>'hero_subtitle'), hero_subtitle),
    hero_image_url = COALESCE((p_changes->>'hero_image_url'), hero_image_url),
    hero_image_zoom = COALESCE((p_changes->>'hero_image_zoom')::INTEGER, hero_image_zoom),
    hero_image_pos_x = COALESCE((p_changes->>'hero_image_pos_x')::INTEGER, hero_image_pos_x),
    hero_image_pos_y = COALESCE((p_changes->>'hero_image_pos_y')::INTEGER, hero_image_pos_y),
    services = COALESCE(jsonb_to_text_array(p_changes->'services'), services),
    show_services = COALESCE((p_changes->>'show_services')::BOOLEAN, show_services),
    gallery = COALESCE(jsonb_to_text_array(p_changes->'gallery'), gallery),
    social_facebook = COALESCE((p_changes->>'social_facebook'), social_facebook),
    social_instagram = COALESCE((p_changes->>'social_instagram'), social_instagram),
    whatsapp = COALESCE((p_changes->>'whatsapp'), whatsapp),
    booking_url = COALESCE((p_changes->>'booking_url'), booking_url),
    pricelist_url = COALESCE((p_changes->>'pricelist_url'), pricelist_url),
    transport_rules_url = COALESCE((p_changes->>'transport_rules_url'), transport_rules_url),
    contact_url = COALESCE((p_changes->>'contact_url'), contact_url),
    services_description = COALESCE((p_changes->>'services_description'), services_description),
    template_variant = COALESCE((p_changes->>'template_variant'), template_variant),
    updated_at = NOW()
  WHERE id = p_draft_id
    AND partner_id = p_partner_id
  RETURNING updated_at INTO v_updated_at;

  -- Získame nové dáta
  SELECT to_jsonb(d.*) INTO v_new_data
  FROM partner_drafts d
  WHERE d.id = p_draft_id;

  -- Vypočítame zmenené polia
  SELECT jsonb_object_agg(key, value) INTO v_changed_fields
  FROM jsonb_each(v_new_data)
  WHERE NOT v_old_data ? key
     OR v_old_data->key IS DISTINCT FROM v_new_data->key;

  -- Priamy INSERT do audit logu
  INSERT INTO audit.activity_log (
    schema_name, table_name, operation, user_id, user_email,
    ip_address, old_data, new_data, changed_fields
  ) VALUES (
    'public', 'partner_drafts', 'UPDATE', p_user_id, p_user_email,
    p_ip_address, v_old_data, v_new_data, v_changed_fields
  );

  RETURN jsonb_build_object(
    'success', true,
    'draft_id', p_draft_id,
    'updated_at', v_updated_at
  );
END;
$$;

-- Fix 2: Change default status for new drafts from 'pending' to 'draft'
CREATE OR REPLACE FUNCTION insert_partner_draft_with_audit(
  p_partner_id UUID,
  p_changes JSONB,
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
  v_draft_id UUID;
  v_new_data JSONB;
BEGIN
  -- Dočasne deaktivujeme trigger
  SET LOCAL audit.skip_trigger = 'true';

  -- INSERT nový draft
  INSERT INTO partner_drafts (
    partner_id,
    company_name,
    description,
    show_description,
    phone,
    email,
    website,
    hero_title,
    hero_subtitle,
    hero_image_url,
    hero_image_zoom,
    hero_image_pos_x,
    hero_image_pos_y,
    services,
    show_services,
    gallery,
    social_facebook,
    social_instagram,
    whatsapp,
    booking_url,
    pricelist_url,
    transport_rules_url,
    contact_url,
    services_description,
    template_variant,
    status
  ) VALUES (
    p_partner_id,
    p_changes->>'company_name',
    p_changes->>'description',
    (p_changes->>'show_description')::BOOLEAN,
    p_changes->>'phone',
    p_changes->>'email',
    p_changes->>'website',
    p_changes->>'hero_title',
    p_changes->>'hero_subtitle',
    p_changes->>'hero_image_url',
    (p_changes->>'hero_image_zoom')::INTEGER,
    (p_changes->>'hero_image_pos_x')::INTEGER,
    (p_changes->>'hero_image_pos_y')::INTEGER,
    jsonb_to_text_array(p_changes->'services'),
    (p_changes->>'show_services')::BOOLEAN,
    jsonb_to_text_array(p_changes->'gallery'),
    p_changes->>'social_facebook',
    p_changes->>'social_instagram',
    p_changes->>'whatsapp',
    p_changes->>'booking_url',
    p_changes->>'pricelist_url',
    p_changes->>'transport_rules_url',
    p_changes->>'contact_url',
    p_changes->>'services_description',
    p_changes->>'template_variant',
    'draft'
  )
  RETURNING id INTO v_draft_id;

  -- Získame nové dáta
  SELECT to_jsonb(d.*) INTO v_new_data
  FROM partner_drafts d
  WHERE d.id = v_draft_id;

  -- Priamy INSERT do audit logu
  INSERT INTO audit.activity_log (
    schema_name, table_name, operation, user_id, user_email,
    ip_address, old_data, new_data, changed_fields
  ) VALUES (
    'public', 'partner_drafts', 'INSERT', p_user_id, p_user_email,
    p_ip_address, NULL, v_new_data, v_new_data
  );

  RETURN jsonb_build_object(
    'success', true,
    'draft_id', v_draft_id,
    'updated_at', NOW()
  );
END;
$$;

-- Granty
GRANT EXECUTE ON FUNCTION update_partner_draft_with_audit TO authenticated;
GRANT EXECUTE ON FUNCTION update_partner_draft_with_audit TO service_role;
GRANT EXECUTE ON FUNCTION insert_partner_draft_with_audit TO authenticated;
GRANT EXECUTE ON FUNCTION insert_partner_draft_with_audit TO service_role;
