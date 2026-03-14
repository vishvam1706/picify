import dbConnect from '@/lib/db';
import User from '@/models/User';
import BlockedUser from '@/models/BlockedUser';
import { withAuth, apiSuccess, apiError } from '@/lib/apiHelpers';

export const POST = withAuth(async (request, { params }) => {
  try {
    await dbConnect();
    const { id: targetUserId } = await params;
    const currentUserId = request.user._id;

    if (targetUserId === currentUserId.toString()) {
      return apiError('You cannot block yourself', 400);
    }

    // Check if already blocked
    const existing = await BlockedUser.findOne({ userId: currentUserId, blockedUserId: targetUserId });
    if (existing) {
      return apiSuccess({ message: 'User is already blocked' });
    }

    await BlockedUser.create({ userId: currentUserId, blockedUserId: targetUserId });

    // Force unfollow both ways
    await User.findByIdAndUpdate(currentUserId, {
      $pull: { following: targetUserId, followers: targetUserId }
    });
    
    await User.findByIdAndUpdate(targetUserId, {
      $pull: { following: currentUserId, followers: currentUserId }
    });

    // We don't decrement the counts precisely here for performance, 
    // a background cron job typically resyncs follower counts.

    return apiSuccess({ message: 'User blocked successfully' });
  } catch (err) {
    if (err.code === 11000) return apiSuccess({ message: 'User is already blocked' });
    console.error('[POST block]', err);
    return apiError('Failed to block user', 500);
  }
});

export const DELETE = withAuth(async (request, { params }) => {
  try {
    await dbConnect();
    const { id: targetUserId } = await params;
    const currentUserId = request.user._id;

    const result = await BlockedUser.findOneAndDelete({ userId: currentUserId, blockedUserId: targetUserId });
    
    if (!result) {
      return apiError('User is not blocked', 404);
    }

    return apiSuccess({ message: 'User unblocked successfully' });
  } catch (err) {
    console.error('[DELETE block]', err);
    return apiError('Failed to unblock user', 500);
  }
});
