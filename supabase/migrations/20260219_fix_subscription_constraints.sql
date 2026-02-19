-- Migration: Fix subscription constraints to support all plan types and statuses
-- Date: 2026-02-19

-- ============================================
-- 1. Add 'mini' to plan_type CHECK constraint
-- ============================================
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_type_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_type_check
  CHECK (plan_type IN ('mini', 'premium', 'partner'));

-- ============================================
-- 2. Expand status CHECK to include all Stripe statuses
-- ============================================
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_status_check
  CHECK (status IN ('active', 'past_due', 'canceled', 'incomplete', 'trialing', 'unpaid', 'incomplete_expired', 'paused'));
