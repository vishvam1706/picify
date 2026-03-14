import dbConnect from '@/lib/db';
import User from '@/models/User';
import Notification from '@/models/Notification';
import Activity from '@/models/Activity';
import { withAuth, apiSuccess, apiError } from '@/lib/apiHelpers';

export const POST = withAuth(async (request, { params }) => {
  try {
    await dbConnect();
    const { id: targetUserId } = await params;
    const currentUserId = request.user._id;

    if (targetUserId === currentUserId.toString()) {
      return apiError('You cannot follow yourself', 400);
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser || !targetUser.isActive || targetUser.isDeleted) {
      return apiError('User not found', 404);
    }

    // Check if already following
    if (targetUser.followers.includes(currentUserId)) {
      return apiSuccess({ message: 'Already following' });
    }

    // Update both users
    await User.findByIdAndUpdate(currentUserId, {
      $addToSet: { following: targetUserId },
      $inc: { followingCount: 1 }
    });

    await User.findByIdAndUpdate(targetUserId, {
      $addToSet: { followers: currentUserId },
      $inc: { followersCount: 1 }
    });

    // Create Notification & Activity
    await Notification.create({
      userId: targetUserId,
      actorId: currentUserId,
      type: 'follow',
      entityId: currentUserId,
      entityType: 'user',
      message: `${request.user.username} started following you`
    });

    await Activity.create({
      userId: currentUserId,
      type: 'follow',
      entityId: targetUserId,
      entityType: 'user'
    });

    return apiSuccess({ message: 'Followed successfully' });
  } catch (err) {
    console.error('[POST follow]', err);
    return apiError('Failed to follow user', 500);
  }
});

export const DELETE = withAuth(async (request, { params }) => {
  try {
    await dbConnect();
    const { id: targetUserId } = await params;
    const currentUserId = request.user._id;

    // Remove from both users
    await User.findByIdAndUpdate(currentUserId, {
      $pull: { following: targetUserId },
      $inc: { followingCount: -1 }
    });

    await User.findByIdAndUpdate(targetUserId, {
      $pull: { followers: currentUserId },
      $inc: { followersCount: -1 }
    });

    return apiSuccess({ message: 'Unfollowed successfully' });
  } catch (err) {
    console.error('[DELETE unfollow]', err);
    return apiError('Failed to unfollow user', 500);
  }
});
