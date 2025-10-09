import { NextRequest, NextResponse } from 'next/server';

// This endpoint is for debugging only - it shows masked versions of environment variables
// to verify they are being loaded correctly
export async function GET(req: NextRequest) {
  // Only allow this in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }
  
  // Get the environment variables
  const stripeApiKey = process.env.STRIPE_API_KEY || '';
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  
  // Mask the sensitive values
  const maskValue = (value: string) => {
    if (!value) return 'NOT SET';
    if (value.length < 8) return '***'; // Too short to show anything
    return `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
  };
  
  // Return the masked values
  return NextResponse.json({
    environment: process.env.NODE_ENV,
    stripe: {
      apiKey: maskValue(stripeApiKey),
      webhookSecret: maskValue(stripeWebhookSecret),
      apiKeyLength: stripeApiKey.length,
      webhookSecretLength: stripeWebhookSecret.length,
      apiKeyPrefix: stripeApiKey.substring(0, 7),
      webhookSecretPrefix: stripeWebhookSecret.substring(0, 6),
    },
    supabase: {
      url: supabaseUrl,
      serviceKeyLength: supabaseServiceKey.length,
      serviceKeyPrefix: maskValue(supabaseServiceKey),
    },
    allEnvKeys: Object.keys(process.env).filter(key => 
      key.includes('STRIPE') || 
      key.includes('SUPABASE') || 
      key.includes('NEXT_PUBLIC')
    ),
  });
}
