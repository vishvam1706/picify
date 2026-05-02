import dbConnect from '@/lib/db';
import User from '@/models/User';
import stripe from '@/lib/stripe';
import { withAuth, apiSuccess, apiError } from '@/lib/apiHelpers';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// POST /api/monetization/connect — Start Stripe Connect onboarding
export const POST = withAuth(async (request) => {
  try {
    await dbConnect();
    const userId = request.user._id;
    const user = await User.findById(userId);

    let accountId = user.stripeConnectedAccountId;

    // If we have a stored account ID, verify it's real before using it
    if (accountId) {
      try {
        await stripe.accounts.retrieve(accountId);
      } catch (verifyErr) {
        // Stale/mock account ID — clear it and create a new one below
        console.warn('[Stripe Connect] Stored account ID is invalid, clearing:', accountId, verifyErr.message);
        accountId = null;
        await User.findByIdAndUpdate(userId, { $unset: { stripeConnectedAccountId: '' } });
      }
    }

    // Create a Stripe Express account if not yet connected
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email,
        capabilities: {
          transfers: { requested: true },
        },
        business_type: 'individual',
        metadata: { picifyUserId: userId.toString() },
      });
      accountId = account.id;
      await User.findByIdAndUpdate(userId, { stripeConnectedAccountId: accountId });
    }

    // Generate an Account Link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${APP_URL}/monetization?stripe=refresh`,
      return_url: `${APP_URL}/monetization?stripe=success`,
      type: 'account_onboarding',
    });

    return apiSuccess({ url: accountLink.url });
  } catch (err) {
    console.error('[POST /api/monetization/connect]', err);
    return apiError('Failed to start Stripe onboarding: ' + err.message, 500);
  }
});

// GET /api/monetization/connect — Check Stripe connection status
export const GET = withAuth(async (request) => {
  try {
    await dbConnect();
    const user = await User.findById(request.user._id).select('stripeConnectedAccountId tipsEnabled').lean();
    
    if (!user.stripeConnectedAccountId) {
      return apiSuccess({ isStripeConnected: false, detailsSubmitted: false, tipsEnabled: false });
    }

    try {
      const account = await stripe.accounts.retrieve(user.stripeConnectedAccountId);
      return apiSuccess({
        isStripeConnected: true,
        detailsSubmitted: account.details_submitted,
        chargesEnabled: account.charges_enabled,
        tipsEnabled: user.tipsEnabled || false,
      });
    } catch {
      // Stale/invalid account ID — treat as not connected
      await User.findByIdAndUpdate(request.user._id, { $unset: { stripeConnectedAccountId: '' } });
      return apiSuccess({ isStripeConnected: false, detailsSubmitted: false, tipsEnabled: false });
    }
  } catch (err) {
    console.error('[GET /api/monetization/connect]', err);
    return apiError('Failed to check Stripe status', 500);
  }
});
