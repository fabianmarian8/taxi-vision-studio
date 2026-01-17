-- Migration: Add is_partner column to taxi_services
-- Date: 2026-01-17
-- Purpose: Enable automatic partner status from Stripe subscriptions

-- ============================================
-- 1. ADD IS_PARTNER COLUMN
-- ============================================
ALTER TABLE taxi_services ADD COLUMN IF NOT EXISTS is_partner BOOLEAN DEFAULT FALSE;

-- Index for partner filtering
CREATE INDEX IF NOT EXISTS idx_taxi_services_partner ON taxi_services(is_partner) WHERE is_partner = TRUE;

-- ============================================
-- 2. UPDATE TRIGGER FUNCTION
-- ============================================
-- Update the existing function to also handle is_partner based on plan_type
CREATE OR REPLACE FUNCTION update_taxi_service_from_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- When subscription status changes, update taxi_service
  IF NEW.status = 'active' THEN
    UPDATE taxi_services
    SET
      is_premium = TRUE,
      is_partner = (NEW.plan_type = 'partner'),
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
-- 3. UPDATE LINK FUNCTION
-- ============================================
-- Update function that links subscription to taxi service
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
  -- Find matching taxi service
  SELECT id INTO v_taxi_service_id
  FROM taxi_services
  WHERE city_slug = p_city_slug
    AND LOWER(name) = LOWER(p_taxi_service_name)
  LIMIT 1;

  IF v_taxi_service_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Get subscription details
  SELECT status, plan_type, current_period_end
  INTO v_subscription_status, v_plan_type, v_period_end
  FROM subscriptions
  WHERE id = p_subscription_id;

  -- Update taxi service
  UPDATE taxi_services
  SET
    subscription_id = p_subscription_id,
    is_premium = (v_subscription_status = 'active'),
    is_partner = (v_subscription_status = 'active' AND v_plan_type = 'partner'),
    premium_expires_at = CASE WHEN v_subscription_status = 'active' THEN v_period_end ELSE NULL END,
    updated_at = NOW()
  WHERE id = v_taxi_service_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
