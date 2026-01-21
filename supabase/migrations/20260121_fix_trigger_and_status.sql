-- Migration: Fix is_partner trigger and extend status CHECK
-- Date: 2026-01-21
-- Purpose: Fix trigger to use correct function with is_partner logic + extend Stripe status support

-- ============================================
-- 1. FIX TRIGGER TO USE CORRECT FUNCTION
-- ============================================
-- The existing trigger (trigger_subscription_status_change) calls update_taxi_service_premium_status()
-- which doesn't handle is_partner. We need to use update_taxi_service_from_subscription() instead.

DROP TRIGGER IF EXISTS trigger_subscription_status_change ON subscriptions;

CREATE TRIGGER trigger_subscription_status_change
  AFTER UPDATE OF status ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_taxi_service_from_subscription();

-- ============================================
-- 2. EXTEND STATUS CHECK CONSTRAINT
-- ============================================
-- Add missing Stripe subscription statuses to prevent webhook failures

ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;

ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_status_check
  CHECK (status IN (
    'active',
    'past_due',
    'canceled',
    'incomplete',
    'trialing',
    'unpaid',
    'paused',
    'incomplete_expired'
  ));

-- ============================================
-- 3. ADD TRIGGER FOR NEW SUBSCRIPTIONS
-- ============================================
-- Also trigger on INSERT to handle new subscriptions immediately

DROP TRIGGER IF EXISTS trigger_subscription_created ON subscriptions;

CREATE TRIGGER trigger_subscription_created
  AFTER INSERT ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_taxi_service_from_subscription();
