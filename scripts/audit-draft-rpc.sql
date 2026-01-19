-- ============================================
-- RPC funkcia pre UPDATE partner_drafts s auditom
-- Rieši problém: session variables nepretrvávajú medzi HTTP požiadavkami
-- ============================================

-- Funkcia pre UPDATE existujúceho draftu
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
  v_result JSONB;
  v_updated_at TIMESTAMPTZ;
BEGIN
  -- Nastaviť audit kontext pre trigger (v rovnakej transakcii)
  PERFORM set_config('audit.user_id', COALESCE(p_user_id::TEXT, ''), false);
  PERFORM set_config('audit.user_email', COALESCE(p_user_email, ''), false);
  PERFORM set_config('audit.ip_address', COALESCE(p_ip_address, ''), false);

  -- Dynamický UPDATE podľa p_changes
  -- Podporované polia: company_name, description, phone, email, website, hero_title, hero_subtitle, etc.
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
    services = COALESCE((p_changes->'services')::TEXT[], services),
    show_services = COALESCE((p_changes->>'show_services')::BOOLEAN, show_services),
    gallery = COALESCE((p_changes->'gallery')::TEXT[], gallery),
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

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Draft not found');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'draft_id', p_draft_id,
    'updated_at', v_updated_at
  );
END;
$$;

-- Funkcia pre INSERT nového draftu
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
  v_updated_at TIMESTAMPTZ;
BEGIN
  -- Nastaviť audit kontext pre trigger (v rovnakej transakcii)
  PERFORM set_config('audit.user_id', COALESCE(p_user_id::TEXT, ''), false);
  PERFORM set_config('audit.user_email', COALESCE(p_user_email, ''), false);
  PERFORM set_config('audit.ip_address', COALESCE(p_ip_address, ''), false);

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
    (p_changes->>'company_name'),
    (p_changes->>'description'),
    (p_changes->>'show_description')::BOOLEAN,
    (p_changes->>'phone'),
    (p_changes->>'email'),
    (p_changes->>'website'),
    (p_changes->>'hero_title'),
    (p_changes->>'hero_subtitle'),
    (p_changes->>'hero_image_url'),
    (p_changes->>'hero_image_zoom')::INTEGER,
    (p_changes->>'hero_image_pos_x')::INTEGER,
    (p_changes->>'hero_image_pos_y')::INTEGER,
    (p_changes->'services')::TEXT[],
    (p_changes->>'show_services')::BOOLEAN,
    (p_changes->'gallery')::TEXT[],
    (p_changes->>'social_facebook'),
    (p_changes->>'social_instagram'),
    (p_changes->>'whatsapp'),
    (p_changes->>'booking_url'),
    (p_changes->>'pricelist_url'),
    (p_changes->>'transport_rules_url'),
    (p_changes->>'contact_url'),
    (p_changes->>'services_description'),
    (p_changes->>'template_variant'),
    'draft'
  )
  RETURNING id, updated_at INTO v_draft_id, v_updated_at;

  RETURN jsonb_build_object(
    'success', true,
    'draft_id', v_draft_id,
    'updated_at', v_updated_at
  );
END;
$$;

-- Funkcia pre PUBLISH draftu (zmena statusu na approved)
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
BEGIN
  -- Nastaviť audit kontext pre trigger (v rovnakej transakcii)
  PERFORM set_config('audit.user_id', COALESCE(p_user_id::TEXT, ''), false);
  PERFORM set_config('audit.user_email', COALESCE(p_user_email, ''), false);
  PERFORM set_config('audit.ip_address', COALESCE(p_ip_address, ''), false);

  UPDATE partner_drafts
  SET
    status = 'approved',
    submitted_at = NOW(),
    reviewed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_draft_id
    AND partner_id = p_partner_id
  RETURNING updated_at INTO v_updated_at;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Draft not found');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'draft_id', p_draft_id,
    'updated_at', v_updated_at
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION update_partner_draft_with_audit TO authenticated;
GRANT EXECUTE ON FUNCTION update_partner_draft_with_audit TO service_role;
GRANT EXECUTE ON FUNCTION insert_partner_draft_with_audit TO authenticated;
GRANT EXECUTE ON FUNCTION insert_partner_draft_with_audit TO service_role;
GRANT EXECUTE ON FUNCTION publish_partner_draft_with_audit TO authenticated;
GRANT EXECUTE ON FUNCTION publish_partner_draft_with_audit TO service_role;
