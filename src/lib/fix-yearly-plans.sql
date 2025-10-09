-- This script fixes the yearly plans in the subscription_plans table

-- 1. Add Business Yearly plan if it doesn't exist
DO $$
DECLARE
  business_yearly_exists INTEGER;
BEGIN
  SELECT COUNT(*) INTO business_yearly_exists FROM subscription_plans WHERE name = 'Business Yearly';
  
  -- Only add Business Yearly plan if it doesn't exist
  IF business_yearly_exists = 0 THEN
    -- Get the Business plan details
    INSERT INTO subscription_plans (
      name, 
      description,
      price_monthly,
      price_yearly,
      credits_per_month,
      features,
      is_active,
      stripe_price_id,
      stripe_price_id_yearly
    )
    SELECT 
      'Business Yearly', 
      description || ' (Annual billing)',
      price_yearly, -- Use yearly price as the monthly price for display
      price_yearly,
      credits_per_month,
      features,
      is_active,
      'price_1SELvjKIeF7PCY4JDmxnPFvY', -- Use the yearly price ID as the primary price ID
      NULL
    FROM subscription_plans
    WHERE name = 'Business';
    
    RAISE NOTICE 'Business Yearly plan added successfully';
  ELSE
    RAISE NOTICE 'Business Yearly plan already exists, skipping';
  END IF;
END $$;

-- 2. Fix the price_monthly field for yearly plans to show yearly price
UPDATE subscription_plans
SET price_monthly = price_yearly
WHERE name LIKE '% Yearly';

-- View the updated plans
SELECT id, name, price_monthly, price_yearly, credits_per_month, stripe_price_id, stripe_price_id_yearly
FROM subscription_plans
WHERE is_active = true
ORDER BY price_monthly;
