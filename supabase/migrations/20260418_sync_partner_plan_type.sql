-- Migration: Sync partners.plan_type from subscription state
-- Date: 2026-04-18
-- Reason: Royal Taxi uploaded a new hero photo but the public page didn't render as partner
--   because partners.plan_type was NULL even though they had a canceled-but-in-grace
--   'partner' subscription. The existing trigger update_taxi_service_from_subscription
--   syncs taxi_services.is_partner but leaves partners.plan_type untouched.
--
-- Behavior:
--   active subscription              -> partners.plan_type = subscription.plan_type
--   canceled + current_period_end >  NOW() (grace period) -> keep subscription plan_type
--   canceled + current_period_end <= NOW() (expired)      -> clear plan_type (partner drops to free)
--   any other status                 -> clear plan_type

-- Helper: map a subscription row to the plan_type that partners should have right now.
CREATE OR REPLACE FUNCTION effective_partner_plan_from_subscription(sub subscriptions)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN sub.status = 'active' THEN sub.plan_type
    WHEN sub.status = 'canceled' AND sub.current_period_end > NOW() THEN sub.plan_type
    ELSE NULL
  END;
$$;

-- Recompute plan_type for every partner linked (via taxi_services) to the given subscription.
CREATE OR REPLACE FUNCTION sync_partner_plan_type_from_subscription(p_subscription_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub subscriptions%ROWTYPE;
  v_plan TEXT;
BEGIN
  SELECT * INTO v_sub FROM subscriptions WHERE id = p_subscription_id;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  v_plan := effective_partner_plan_from_subscription(v_sub);

  UPDATE partners p
  SET plan_type = v_plan,
      updated_at = NOW()
  FROM taxi_services t
  WHERE t.id = p.taxi_service_id
    AND t.subscription_id = p_subscription_id
    AND p.plan_type IS DISTINCT FROM v_plan;
END;
$$;

-- Trigger on subscriptions: whenever a subscription is inserted or updated,
-- push the derived plan_type down to linked partners.
CREATE OR REPLACE FUNCTION trg_sync_partner_plan_type()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM sync_partner_plan_type_from_subscription(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS subscriptions_sync_partner_plan_type ON subscriptions;
CREATE TRIGGER subscriptions_sync_partner_plan_type
  AFTER INSERT OR UPDATE OF status, plan_type, current_period_end
  ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION trg_sync_partner_plan_type();

-- Also run whenever a taxi_service gets linked to a (different) subscription.
CREATE OR REPLACE FUNCTION trg_sync_partner_plan_type_on_service_link()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.subscription_id IS NOT NULL
     AND NEW.subscription_id IS DISTINCT FROM COALESCE(OLD.subscription_id, NULL) THEN
    PERFORM sync_partner_plan_type_from_subscription(NEW.subscription_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS taxi_services_sync_partner_plan_type ON taxi_services;
CREATE TRIGGER taxi_services_sync_partner_plan_type
  AFTER INSERT OR UPDATE OF subscription_id
  ON taxi_services
  FOR EACH ROW
  EXECUTE FUNCTION trg_sync_partner_plan_type_on_service_link();

-- Conservative backfill:
--   1) partners with NULL plan_type but an active/grace subscription -> assign plan_type.
-- We intentionally do NOT clear plan_type for partners whose subscription has expired,
-- because some historical partners may have been grandfathered manually (e.g. OuKej Taxi).
-- Those need a separate business decision before auto-downgrade.
UPDATE partners p
SET plan_type = effective_partner_plan_from_subscription(s),
    updated_at = NOW()
FROM taxi_services t
JOIN subscriptions s ON s.id = t.subscription_id
WHERE t.id = p.taxi_service_id
  AND p.plan_type IS NULL
  AND effective_partner_plan_from_subscription(s) IS NOT NULL;
