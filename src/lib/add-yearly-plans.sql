-- This script adds separate yearly plans to the subscription_plans table

-- First, let's check if we already have yearly plans
DO $$
DECLARE
  yearly_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO yearly_count FROM subscription_plans WHERE name LIKE '% Yearly';
  
  -- Only add yearly plans if they don't exist
  IF yearly_count = 0 THEN
    -- Insert yearly version of each plan (except Free)
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
      name || ' Yearly', 
      description || ' (Annual billing)',
      price_monthly,
      price_yearly,
      credits_per_month,
      features,
      is_active,
      NULL, -- No monthly price ID for yearly plans
      stripe_price_id_yearly -- Use the yearly price ID as the primary price ID
    FROM subscription_plans
    WHERE name != 'Free' AND stripe_price_id_yearly IS NOT NULL;
    
    -- Update the original plans to have NULL stripe_price_id_yearly
    -- This ensures each plan only has one price ID
    UPDATE subscription_plans
    SET stripe_price_id_yearly = NULL
    WHERE name NOT LIKE '% Yearly';
    
    RAISE NOTICE 'Yearly plans added successfully';
  ELSE
    RAISE NOTICE 'Yearly plans already exist, skipping';
  END IF;
END $$;

-- View the updated plans
SELECT id, name, price_monthly, price_yearly, credits_per_month, stripe_price_id, stripe_price_id_yearly
FROM subscription_plans
WHERE is_active = true
ORDER BY price_monthly;
