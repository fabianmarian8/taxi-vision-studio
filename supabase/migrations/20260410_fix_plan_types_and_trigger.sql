-- Migration: Fix plan_type constraint and trigger for new plan types
-- Date: 2026-04-10
-- Fixes: managed, newPartner, leader plan types not accepted by DB

-- ============================================
-- 1. Expand plan_type CHECK constraint
-- ============================================
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_type_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_type_check
  CHECK (plan_type IN ('mini', 'premium', 'partner', 'managed', 'newPartner', 'leader'));

-- ============================================
-- 2. Fix trigger function — handle all partner-tier plans
-- ============================================
CREATE OR REPLACE FUNCTION update_taxi_service_from_subscription()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' THEN
    UPDATE taxi_services
    SET
      is_premium = TRUE,
      is_partner = (NEW.plan_type IN ('partner', 'newPartner', 'leader')),
      premium_expires_at = NEW.current_period_end,
      updated_at = NOW()
    WHERE subscription_id = NEW.id;
  ELSE
    UPDATE taxi_services
    SET
      is_premium = FALSE,
      is_partner = FALSE,
      premium_expires_at = NULL,
      updated_at = NOW()
    WHERE subscription_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. Fix link function — handle all partner-tier plans
-- ============================================
CREATE OR REPLACE FUNCTION link_subscription_to_taxi_service(
  p_subscription_id UUID,
  p_city_slug TEXT,
  p_taxi_service_name TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_taxi_service_id UUID;
  v_subscription_status TEXT;
  v_plan_type TEXT;
  v_period_end TIMESTAMPTZ;
BEGIN
  SELECT id INTO v_taxi_service_id
  FROM taxi_services
  WHERE city_slug = p_city_slug
    AND LOWER(name) = LOWER(p_taxi_service_name)
  LIMIT 1;

  IF v_taxi_service_id IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT status, plan_type, current_period_end
  INTO v_subscription_status, v_plan_type, v_period_end
  FROM subscriptions
  WHERE id = p_subscription_id;

  UPDATE taxi_services
  SET
    subscription_id = p_subscription_id,
    is_premium = (v_subscription_status = 'active'),
    is_partner = (v_subscription_status = 'active' AND v_plan_type IN ('partner', 'newPartner', 'leader')),
    premium_expires_at = CASE WHEN v_subscription_status = 'active' THEN v_period_end ELSE NULL END,
    updated_at = NOW()
  WHERE id = v_taxi_service_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. Atomic OTP attempt increment + code verification
-- Returns: verified BOOLEAN, remaining_attempts INT
-- Uses row-level lock (SELECT FOR UPDATE) to prevent race conditions
-- ============================================
CREATE OR REPLACE FUNCTION verify_otp_attempt(
  p_id UUID,
  p_code TEXT,
  p_max_attempts INT
) RETURNS TABLE(
  result TEXT,         -- 'verified' | 'wrong_code' | 'max_attempts'
  remaining INT
) AS $$
DECLARE
  v_code TEXT;
  v_attempts INT;
BEGIN
  -- Lock the row and get current state atomically
  SELECT cv.code, cv.attempts INTO v_code, v_attempts
  FROM claim_verifications cv
  WHERE cv.id = p_id AND cv.verified = FALSE
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 'max_attempts'::TEXT, 0;
    RETURN;
  END IF;

  IF v_attempts >= p_max_attempts THEN
    RETURN QUERY SELECT 'max_attempts'::TEXT, 0;
    RETURN;
  END IF;

  -- Atomically increment attempts
  UPDATE claim_verifications SET attempts = attempts + 1 WHERE id = p_id;

  IF v_code = p_code THEN
    -- Mark as verified
    UPDATE claim_verifications SET verified = TRUE WHERE id = p_id;
    RETURN QUERY SELECT 'verified'::TEXT, (p_max_attempts - v_attempts - 1);
  ELSE
    RETURN QUERY SELECT 'wrong_code'::TEXT, (p_max_attempts - v_attempts - 1);
  END IF;
END;
$$ LANGUAGE plpgsql;
