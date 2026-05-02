import dbConnect from '@/lib/db';
import User from '@/models/User';
import { withAuth, apiSuccess, apiError } from '@/lib/apiHelpers';

// PATCH /api/monetization/tips — Enable or disable tips for the authenticated user
export const PATCH = withAuth(async (request) => {
  try {
    await dbConnect();
    const { enabled } = await request.json();
    const user = await User.findById(request.user._id).select('stripeConnectedAccountId tipsEnabled');

    if (!user.stripeConnectedAccountId) {
      return apiError('You must connect Stripe before enabling tips', 400);
    }

    user.tipsEnabled = !!enabled;
    await user.save();

    return apiSuccess({ tipsEnabled: user.tipsEnabled });
  } catch (err) {
    console.error('[PATCH /api/monetization/tips]', err);
    return apiError('Failed to update tips setting', 500);
  }
});
