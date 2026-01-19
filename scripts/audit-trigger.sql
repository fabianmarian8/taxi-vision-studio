-- ===========================================
-- AUDIT TRIGGER pre partner portal aktivity
-- ===========================================

-- 1. Vytvorenie audit schémy a tabuľky
CREATE SCHEMA IF NOT EXISTS audit;

CREATE TABLE IF NOT EXISTS audit.activity_log (
  id bigserial PRIMARY KEY,
  table_schema name NOT NULL,
  table_name name NOT NULL,
  operation varchar(10) NOT NULL,
  user_id uuid,
  user_email text,
  ip_address text,
  old_data jsonb,
  new_data jsonb,
  changed_fields jsonb,
  created_at timestamptz DEFAULT NOW()
);

-- 2. Indexy pre rýchle vyhľadávanie
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON audit.activity_log USING brin(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON audit.activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_table ON audit.activity_log(table_schema, table_name);

-- 3. Helper funkcia pre získanie info o používateľovi
CREATE OR REPLACE FUNCTION audit.get_current_user_info()
RETURNS TABLE(user_id uuid, user_email text, ip_address text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    auth.uid(),
    (auth.jwt()->>'email')::text,
    (current_setting('request.headers', true)::json->>'x-forwarded-for')::text;
END;
$$;

-- 4. Hlavná trigger funkcia
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
BEGIN
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

-- 5. Funkcia pre aktiváciu trackingu na tabuľke
CREATE OR REPLACE FUNCTION audit.enable_tracking(target_table regclass)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_trigger_name text;
BEGIN
  v_trigger_name := 'audit_trigger_' || replace(target_table::text, '.', '_');
  EXECUTE format(
    'DROP TRIGGER IF EXISTS %I ON %s',
    v_trigger_name, target_table
  );
  EXECUTE format(
    'CREATE TRIGGER %I
     AFTER INSERT OR UPDATE OR DELETE ON %s
     FOR EACH ROW EXECUTE FUNCTION audit.log_activity()',
    v_trigger_name, target_table
  );
END;
$$;

-- 6. Funkcia pre deaktiváciu trackingu
CREATE OR REPLACE FUNCTION audit.disable_tracking(target_table regclass)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_trigger_name text;
BEGIN
  v_trigger_name := 'audit_trigger_' || replace(target_table::text, '.', '_');
  EXECUTE format(
    'DROP TRIGGER IF EXISTS %I ON %s',
    v_trigger_name, target_table
  );
END;
$$;

-- 7. Aktivovať tracking na partner tabuľkách
SELECT audit.enable_tracking('public.partners'::regclass);
SELECT audit.enable_tracking('public.partner_drafts'::regclass);

-- 8. RLS politiky pre audit tabuľku (len superadmin môže čítať)
ALTER TABLE audit.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins can read audit logs" ON audit.activity_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_superadmin = true
    )
  );
