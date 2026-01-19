-- ============================================
-- OPRAVENÉ RPC funkcie - priamy zápis do audit logu
-- Riešenie: namiesto session variables priamo zapisujeme do audit.activity_log
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
  -- (keďže my sami zapisujeme audit)
  SET LOCAL audit.skip_trigger = 'true';

  -- UPDATE draft
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

  -- Získame nové dáta
  SELECT to_jsonb(d.*) INTO v_new_data
  FROM partner_drafts d
  WHERE d.id = p_draft_id;

  -- Vypočítame zmenené polia
  SELECT jsonb_object_agg(key, value) INTO v_changed_fields
  FROM jsonb_each(v_new_data)
  WHERE NOT v_old_data ? key
     OR v_old_data->key IS DISTINCT FROM value;

  -- PRIAMY zápis do audit logu (bez spoliehania na trigger)
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
  v_new_data JSONB;
BEGIN
  -- Dočasne deaktivujeme trigger
  SET LOCAL audit.skip_trigger = 'true';

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

  -- Získame nové dáta pre audit
  SELECT to_jsonb(d.*) INTO v_new_data
  FROM partner_drafts d
  WHERE d.id = v_draft_id;

  -- PRIAMY zápis do audit logu
  INSERT INTO audit.activity_log (
    table_schema, table_name, operation, user_id, user_email,
    ip_address, old_data, new_data, changed_fields
  ) VALUES (
    'public', 'partner_drafts', 'INSERT', p_user_id, p_user_email,
    p_ip_address, NULL, v_new_data, NULL
  );

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
  v_old_data JSONB;
  v_new_data JSONB;
  v_changed_fields JSONB;
BEGIN
  -- Získame staré dáta
  SELECT to_jsonb(d.*) INTO v_old_data
  FROM partner_drafts d
  WHERE d.id = p_draft_id AND d.partner_id = p_partner_id;

  IF v_old_data IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Draft not found');
  END IF;

  -- Dočasne deaktivujeme trigger
  SET LOCAL audit.skip_trigger = 'true';

  UPDATE partner_drafts
  SET
    status = 'approved',
    submitted_at = NOW(),
    reviewed_at = NOW(),
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
     OR v_old_data->key IS DISTINCT FROM value;

  -- PRIAMY zápis do audit logu
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
    'updated_at', v_updated_at
  );
END;
$$;

-- Upravíme trigger aby preskočil ak je nastavené audit.skip_trigger
CREATE OR REPLACE FUNCTION audit.log_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_user_email text;
  v_ip_address text;
  v_old_data jsonb := NULL;
  v_new_data jsonb := NULL;
  v_changed_fields jsonb := NULL;
  v_skip text;
BEGIN
  -- Ak je nastavené skip_trigger, preskočíme (RPC funkcia sama zapisuje audit)
  v_skip := current_setting('audit.skip_trigger', true);
  IF v_skip = 'true' THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  -- Získať info o aktuálnom používateľovi
  SELECT * INTO v_user_id, v_user_email, v_ip_address
  FROM audit.get_current_user_info();

  -- Podľa typu operácie
  IF TG_OP = 'INSERT' THEN
    v_new_data := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
    -- Zistiť ktoré polia sa zmenili
    SELECT jsonb_object_agg(key, value) INTO v_changed_fields
    FROM jsonb_each(v_new_data)
    WHERE NOT v_old_data ? key
       OR v_old_data->key IS DISTINCT FROM value;
  ELSIF TG_OP = 'DELETE' THEN
    v_old_data := to_jsonb(OLD);
  END IF;

  -- Zapísať do logu
  INSERT INTO audit.activity_log (
    table_schema, table_name, operation, user_id, user_email,
    ip_address, old_data, new_data, changed_fields
  ) VALUES (
    TG_TABLE_SCHEMA, TG_TABLE_NAME, TG_OP, v_user_id, v_user_email,
    v_ip_address, v_old_data, v_new_data, v_changed_fields
  );

  -- Vrátiť správny riadok
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION update_partner_draft_with_audit TO authenticated;
GRANT EXECUTE ON FUNCTION update_partner_draft_with_audit TO service_role;
GRANT EXECUTE ON FUNCTION insert_partner_draft_with_audit TO authenticated;
GRANT EXECUTE ON FUNCTION insert_partner_draft_with_audit TO service_role;
GRANT EXECUTE ON FUNCTION publish_partner_draft_with_audit TO authenticated;
GRANT EXECUTE ON FUNCTION publish_partner_draft_with_audit TO service_role;
