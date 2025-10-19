import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripeSecretKey || !webhookSecret) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 400 }
      );
    }

    // Get raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      );
    }

    // Import Stripe dynamically
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-02-24.acacia',
    });

    // Verify webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;

      const userId = session.client_reference_id || session.metadata?.user_id;
      const amountCents = parseInt(session.metadata?.amount_cents || '0');
      const paymentIntentId = session.payment_intent;

      if (!userId || !amountCents || !paymentIntentId) {
        console.error('Missing required session data:', { userId, amountCents, paymentIntentId });
        return NextResponse.json(
          { error: 'Invalid session data' },
          { status: 400 }
        );
      }

      // Create server-side Supabase client with service role key
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseServiceKey) {
        return NextResponse.json(
          { error: 'Server configuration error' },
          { status: 500 }
        );
      }

      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

      // Insert into wallet_external_payments table (idempotent)
      const { error: insertError } = await supabaseAdmin
        .from('wallet_external_payments')
        .insert({
          provider: 'stripe',
          provider_payment_id: paymentIntentId,
          amount_cents: amountCents,
          currency: 'GBP',
          user_id: userId,
          status: 'completed',
        });

      // If unique violation, this payment already processed (idempotent)
      if (insertError && insertError.code === '23505') {
        console.log('Payment already processed:', paymentIntentId);
        return NextResponse.json({ received: true });
      }

      if (insertError) {
        throw insertError;
      }

      // Call wallet_apply RPC to credit the wallet
      const { error: rpcError } = await supabaseAdmin.rpc('wallet_apply', {
        change_cents: amountCents,
        reason: 'topup:stripe',
        target_user_id: userId,
      });

      if (rpcError) {
        throw rpcError;
      }

      console.log('Wallet credited:', { userId, amountCents, paymentIntentId });
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
