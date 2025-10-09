-- This script updates the subscription_plans table with Stripe price IDs
-- Run this in your Supabase SQL editor

-- Create new columns to store Stripe price IDs if they don't exist
DO $$
BEGIN
  -- Add stripe_price_id column for monthly prices if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'subscription_plans' 
    AND column_name = 'stripe_price_id'
  ) THEN
    ALTER TABLE subscription_plans ADD COLUMN stripe_price_id text;
  END IF;
  
  -- Add stripe_price_id_yearly column for yearly prices if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'subscription_plans' 
    AND column_name = 'stripe_price_id_yearly'
  ) THEN
    ALTER TABLE subscription_plans ADD COLUMN stripe_price_id_yearly text;
  END IF;
END $$;

-- Update the Lite plan with Stripe price IDs
-- First update the monthly price ID
UPDATE subscription_plans
SET stripe_price_id = 'price_1SELqMKIeF7PCY4JjPiAhvmx' -- Monthly (from latest webhook event)
WHERE name = 'Lite' AND price_monthly = 9900;

-- Then update the yearly price ID
UPDATE subscription_plans
SET stripe_price_id_yearly = 'price_1SELtRKIeF7PCY4Jti48TBYA' -- Yearly (from latest webhook event)
WHERE name = 'Lite' AND price_monthly = 9900;

-- Update the Business plan with Stripe price IDs
UPDATE subscription_plans
SET stripe_price_id = 'price_1SELv9KIeF7PCY4J8o8mvjHB' -- Monthly (from webhook event)
WHERE name = 'Business' AND price_monthly = 29900;

-- Update the Heavy plan with Stripe price IDs
UPDATE subscription_plans
SET stripe_price_id = 'price_1SELvjKIeF7PCY4Jbf4vtqC2' -- Monthly
WHERE name = 'Heavy' AND price_monthly = 79900;

-- Add annual price IDs if you have them
-- UPDATE subscription_plans
-- SET stripe_price_id = 'price_1SELvjKIeF7PCY4JYvgmLtXB' -- Annual
-- WHERE name = 'Heavy' AND price_yearly = 799900;

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscription_plans_stripe_price_id ON subscription_plans(stripe_price_id);

-- View the updated plans
SELECT id, name, price_monthly, stripe_price_id
FROM subscription_plans
WHERE is_active = true
ORDER BY price_monthly;
