import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    const stripeEnabled = process.env.NEXT_PUBLIC_STRIPE_ENABLED;
    
    // If explicitly disabled or keys missing, return demo mode
    if (stripeEnabled === 'false' || !stripeSecretKey || !stripePublishableKey) {
      return NextResponse.json(
        { mode: 'demo', message: 'Stripe not configured' },
        { status: 403 }
      );
    }

    // Create secure server-side Supabase client (uses HTTP-only cookies)
    const supabase = await createServerClient();

    // Get authenticated user (secure - reads from HTTP-only cookies)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 401 });
    }

    // Parse request body
    const { amount_cents } = await request.json();
    
    // Validate amount
    if (!amount_cents || amount_cents < 100 || amount_cents > 1000000) {
      return NextResponse.json(
        { error: 'Invalid amount (must be between £1 and £10,000)' },
        { status: 400 }
      );
    }

    // Import Stripe dynamically
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-02-24.acacia',
    });

    // Get site URL for success/cancel redirects
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                    `${request.headers.get('origin')}` ||
                    'http://localhost:3001';

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: 'Wallet Top-Up',
              description: `Add £${(amount_cents / 100).toFixed(2)} to your InPlay Golf wallet`,
            },
            unit_amount: amount_cents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${siteUrl}/wallet?status=success`,
      cancel_url: `${siteUrl}/wallet?status=cancelled`,
      client_reference_id: user.id,
      customer_email: user.email,
      metadata: {
        user_id: user.id,
        amount_cents: amount_cents.toString(),
        purpose: 'wallet_topup',
      },
    });

    return NextResponse.json({ sessionUrl: session.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
