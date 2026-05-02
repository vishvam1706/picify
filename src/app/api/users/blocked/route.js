import dbConnect from '@/lib/db';
import BlockedUser from '@/models/BlockedUser';
import { withAuth, apiSuccess, apiError } from '@/lib/apiHelpers';

// GET /api/users/blocked — get list of users blocked by current user
export const GET = withAuth(async (request) => {
  try {
    await dbConnect();
    const blocked = await BlockedUser.find({ userId: request.user._id })
      .populate('blockedUserId', 'username displayName profileImage')
      .sort({ blockedAt: -1 })
      .lean();

    const result = blocked.map(b => ({
      _id: b._id,
      blockedUserId: b.blockedUserId?._id,
      blockedUser: b.blockedUserId,
      blockedAt: b.blockedAt,
    }));

    return apiSuccess(result);
  } catch (err) {
    console.error('[GET /api/users/blocked]', err);
    return apiError('Failed to fetch blocked users', 500);
  }
});
