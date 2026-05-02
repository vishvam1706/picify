import { NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Earnings from '@/models/Earnings';

// Must disable body parsing — Stripe needs the raw body to verify the signature
export const config = {
  api: { bodyParser: false },
};

// POST /api/webhooks/stripe
export async function POST(request) {
  const rawBody = await request.text();
  const sig = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('[Stripe Webhook] Signature verification failed:', err.message);
    return NextResponse.json({ error: `Webhook signature invalid: ${err.message}` }, { status: 400 });
  }

  await dbConnect();

  try {
    switch (event.type) {

      // ── Tip / one-time payment completed ──────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object;

        // Only handle tip payments (identified by our metadata)
        if (session.payment_intent_data?.metadata?.tipType !== 'pin_tip' &&
            session.metadata?.tipType !== 'pin_tip') break;

        const meta = session.metadata || {};
        const creatorId = meta.creatorId;
        const fromUserId = meta.fromUserId || null;
        const pinId = meta.pinId || null;

        if (!creatorId) break;

        // Amount creator receives = total - application_fee (which was 10%)
        const totalAmount = session.amount_total; // in cents
        const platformFee = Math.round(totalAmount * 0.10);
        const creatorAmount = totalAmount - platformFee;

        await Earnings.create({
          userId: creatorId,
          type: 'tip',
          amount: creatorAmount,         // creator's 90%
          currency: session.currency || 'usd',
          status: 'completed',
          fromUserId: fromUserId || undefined,
          pinId: pinId || undefined,
          stripePaymentIntentId: session.payment_intent,
          note: `Tip via Stripe Checkout — session ${session.id}`,
        });

        console.log(`[Stripe Webhook] Tip recorded: $${(creatorAmount / 100).toFixed(2)} for creator ${creatorId}`);
        break;
      }

      // ── Stripe Connect account updated (onboarding completed) ─────────
      case 'account.updated': {
        const account = event.data.object;

        if (!account.details_submitted) break;

        // Find user by their connected account ID and mark as active
        const user = await User.findOne({ stripeConnectedAccountId: account.id });
        if (!user) {
          console.warn(`[Stripe Webhook] account.updated: No user found for account ${account.id}`);
          break;
        }

        console.log(`[Stripe Webhook] Stripe account onboarding complete for user ${user._id} (charges_enabled: ${account.charges_enabled})`);
        // No DB changes needed — charges_enabled is fetched live from Stripe API in the overview route
        break;
      }

      // ── Payment intent succeeded (backup confirmation) ─────────────────
      case 'payment_intent.succeeded': {
        const pi = event.data.object;
        const meta = pi.metadata || {};

        if (meta.tipType !== 'pin_tip') break;

        // Check if this earnings record was already created by checkout.session.completed
        const exists = await Earnings.findOne({ stripePaymentIntentId: pi.id });
        if (exists) break; // already handled via checkout.session.completed

        const creatorId = meta.creatorId;
        if (!creatorId) break;

        const creatorAmount = pi.amount - Math.round(pi.amount * 0.10);
        await Earnings.create({
          userId: creatorId,
          type: 'tip',
          amount: creatorAmount,
          currency: pi.currency || 'usd',
          status: 'completed',
          fromUserId: meta.fromUserId || undefined,
          pinId: meta.pinId || undefined,
          stripePaymentIntentId: pi.id,
          note: `Tip via payment intent ${pi.id}`,
        });

        console.log(`[Stripe Webhook] payment_intent.succeeded — tip recorded for creator ${creatorId}`);
        break;
      }

      // ── Payment failed ─────────────────────────────────────────────────
      case 'payment_intent.payment_failed': {
        const pi = event.data.object;
        console.warn(`[Stripe Webhook] Payment failed: ${pi.id} — ${pi.last_payment_error?.message}`);
        break;
      }

      // ── Refund / dispute ───────────────────────────────────────────────
      case 'charge.refunded': {
        const charge = event.data.object;
        const earning = await Earnings.findOne({ stripePaymentIntentId: charge.payment_intent });
        if (earning) {
          earning.status = 'refunded';
          await earning.save();
          console.log(`[Stripe Webhook] Earning ${earning._id} marked as refunded`);
        }
        break;
      }

      default:
        // Silently ignore unhandled events
        break;
    }
  } catch (err) {
    console.error(`[Stripe Webhook] Error handling event ${event.type}:`, err);
    // Return 200 so Stripe doesn't retry — internal errors shouldn't cause retries
    return NextResponse.json({ received: true, warning: 'Internal handler error' }, { status: 200 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
