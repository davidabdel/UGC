-- This script adds the stripe_price_id_yearly column and updates the subscription plans with yearly price IDs

-- Add the stripe_price_id_yearly column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'subscription_plans' 
    AND column_name = 'stripe_price_id_yearly'
  ) THEN
    ALTER TABLE subscription_plans ADD COLUMN stripe_price_id_yearly text;
  END IF;
END $$;

-- Update the Lite plan with yearly Stripe price ID
UPDATE subscription_plans
SET stripe_price_id_yearly = 'price_1SELtRKIeF7PCY4Jti48TBYA' -- Yearly (from webhook event)
WHERE name = 'Lite' AND price_monthly = 9900;

-- Update the Business plan with yearly Stripe price ID (if you have it)
-- UPDATE subscription_plans
-- SET stripe_price_id_yearly = 'price_XXXXXXXXXXXXXXXXX' -- Replace with your yearly price ID
-- WHERE name = 'Business' AND price_monthly = 29900;

-- Update the Heavy plan with yearly Stripe price ID
UPDATE subscription_plans
SET stripe_price_id_yearly = 'price_1SELvjKIeF7PCY4JYvgmLtXB' -- Yearly (from previous comments)
WHERE name = 'Heavy' AND price_monthly = 79900;

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscription_plans_stripe_price_id_yearly ON subscription_plans(stripe_price_id_yearly);

-- View the updated plans
SELECT id, name, price_monthly, price_yearly, stripe_price_id, stripe_price_id_yearly
FROM subscription_plans
WHERE is_active = true
ORDER BY price_monthly;
