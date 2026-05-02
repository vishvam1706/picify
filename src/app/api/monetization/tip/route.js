import dbConnect from '@/lib/db';
import User from '@/models/User';
import Pin from '@/models/Pin';
import stripe from '@/lib/stripe';
import { withAuth, apiSuccess, apiError } from '@/lib/apiHelpers';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// POST /api/monetization/tip
// Body: { creatorId, pinId, amount } — amount in cents (e.g. 500 = $5.00)
export const POST = withAuth(async (request) => {
  try {
    await dbConnect();
    const { creatorId, pinId, amount } = await request.json();

    if (!creatorId || !amount || amount < 100) {
      return apiError('Invalid tip data. Minimum tip is $1.00.', 400);
    }

    const creator = await User.findById(creatorId).select('stripeConnectedAccountId tipsEnabled displayName username').lean();
    if (!creator) return apiError('Creator not found', 404);
    if (!creator.tipsEnabled) return apiError('This creator has not enabled tips', 400);
    if (!creator.stripeConnectedAccountId) return apiError('Creator has not connected Stripe', 400);

    const pin = pinId ? await Pin.findById(pinId).select('title').lean() : null;

    // Platform fee: 10% of tip (creator gets 90%)
    const platformFee = Math.round(amount * 0.10);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Tip for ${creator.displayName || creator.username}`,
              description: pin ? `Supporting pin: "${pin.title}"` : 'A tip to support this creator',
            },
            unit_amount: amount, // in cents
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: platformFee,
        transfer_data: {
          destination: creator.stripeConnectedAccountId,
        },
      },
      metadata: {
        tipType: 'pin_tip',
        creatorId: creatorId.toString(),
        fromUserId: request.user._id.toString(),
        pinId: pinId || '',
      },
      success_url: `${APP_URL}/api/monetization/tip/confirm?session_id={CHECKOUT_SESSION_ID}&pin=${pinId || ''}`,
      cancel_url: `${APP_URL}/tip/failed?pin=${pinId || ''}&reason=cancelled`,
    });

    return apiSuccess({ checkoutUrl: session.url, sessionId: session.id });
  } catch (err) {
    console.error('[POST /api/monetization/tip]', err);
    return apiError('Failed to create tip checkout: ' + err.message, 500);
  }
});
