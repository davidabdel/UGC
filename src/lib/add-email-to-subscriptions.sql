-- Add email column to user_subscriptions table
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS email TEXT;

-- Create an index on the email column for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_email ON user_subscriptions(email);

-- Update existing subscriptions with emails from auth.users (if possible)
-- This is a one-time migration for existing data
WITH user_emails AS (
  SELECT id, email FROM auth.users
)
UPDATE user_subscriptions us
SET email = ue.email
FROM user_emails ue
WHERE us.user_id = ue.id
  AND us.email IS NULL;

-- View the updated table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_subscriptions';

-- View a sample of subscriptions with emails
SELECT id, user_id, email, plan_id, status, current_period_start, current_period_end
FROM user_subscriptions
LIMIT 10;
