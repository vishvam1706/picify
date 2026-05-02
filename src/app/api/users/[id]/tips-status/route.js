import dbConnect from '@/lib/db';
import User from '@/models/User';
import { withOptionalAuth, apiSuccess, apiError } from '@/lib/apiHelpers';

// GET /api/users/[id]/tips-status — public endpoint to check if creator accepts tips
export const GET = withOptionalAuth(async (request, { params }) => {
  try {
    await dbConnect();
    const { id } = await params;
    const user = await User.findById(id).select('tipsEnabled stripeConnectedAccountId').lean();
    if (!user) return apiError('User not found', 404);

    return apiSuccess({
      tipsEnabled: !!(user.tipsEnabled && user.stripeConnectedAccountId),
    });
  } catch (err) {
    console.error('[GET /api/users/[id]/tips-status]', err);
    return apiError('Failed to check tips status', 500);
  }
});
