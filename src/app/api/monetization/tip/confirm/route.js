import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import stripe from '@/lib/stripe';
import Earnings from '@/models/Earnings';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * GET /api/monetization/tip/confirm?session_id=xxx&pin=yyy
 *
 * Called by Stripe redirect after a successful checkout.
 * Verifies the session, records earnings (idempotently), then redirects
 * the user back to the pin page with ?tip=success.
 *
 * This is the fallback for when webhooks are not configured (dev mode).
 * In production, both this AND the webhook may fire — idempotency check
 * (stripePaymentIntentId unique index) prevents double-recording.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');
  const pinId = searchParams.get('pin') || '';

  const pinParam = pinId ? `?pin=${pinId}` : '';

  if (!sessionId) {
    return NextResponse.redirect(`${APP_URL}/tip/failed${pinParam}&reason=error`);
  }

  try {
    await dbConnect();

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent'],
    });

    if (session.payment_status !== 'paid') {
      console.warn(`[TipConfirm] Session ${sessionId} not paid yet: ${session.payment_status}`);
      return NextResponse.redirect(`${APP_URL}/tip/failed${pinParam}&reason=pending`);
    }

    const meta = session.metadata || {};
    const creatorId = meta.creatorId;
    const fromUserId = meta.fromUserId || null;
    const metaPinId = meta.pinId || pinId || null;
    const paymentIntentId = typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id;

    if (!creatorId) {
      return NextResponse.redirect(`${APP_URL}/tip/success${pinParam}`);
    }

    // Idempotency check — don't record twice if webhook already handled it
    const alreadyRecorded = await Earnings.findOne({ stripePaymentIntentId: paymentIntentId });
    if (alreadyRecorded) {
      console.log(`[TipConfirm] Already recorded for PI ${paymentIntentId} — skipping`);
      return NextResponse.redirect(`${APP_URL}/tip/success${pinParam}`);
    }

    // Record the earning: creator gets 90%, platform keeps 10%
    const totalAmount = session.amount_total; // cents
    const platformFee = Math.round(totalAmount * 0.10);
    const creatorAmount = totalAmount - platformFee;

    await Earnings.create({
      userId: creatorId,
      type: 'tip',
      amount: creatorAmount,
      currency: session.currency || 'usd',
      status: 'completed',
      fromUserId: fromUserId || undefined,
      pinId: metaPinId || undefined,
      stripePaymentIntentId: paymentIntentId,
      note: `Tip via Stripe Checkout — session ${sessionId}`,
    });

    console.log(`[TipConfirm] ✅ Recorded $${(creatorAmount / 100).toFixed(2)} tip for creator ${creatorId}`);

    const successParams = new URLSearchParams();
    if (pinId) successParams.set('pin', pinId);
    successParams.set('amount', String(totalAmount));
    return NextResponse.redirect(`${APP_URL}/tip/success?${successParams.toString()}`);
  } catch (err) {
    console.error('[TipConfirm] Error:', err.message);
    return NextResponse.redirect(`${APP_URL}/tip/failed${pinParam}&reason=error`);
  }
}
