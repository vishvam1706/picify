import dbConnect from '@/lib/db';
import User from '@/models/User';
import { withOptionalAuth, apiSuccess, apiError } from '@/lib/apiHelpers';

export const GET = withOptionalAuth(async (request, { params }) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    
    await dbConnect();
    const { id: targetUserId } = await params;
    
    const targetUser = await User.findById(targetUserId).select('privacy following');
    if (!targetUser) return apiError('User not found', 404);

    // Privacy check — only block if owner explicitly hid followers
    const isOwner = request.user && request.user._id.toString() === targetUserId;
    if (!isOwner && targetUser.privacy?.showFollowers === false) {
      return apiError('This user\'s following list is private', 403);
    }

    const total = targetUser.following.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const followingIds = targetUser.following.slice(startIndex, endIndex);
    const followingUsers = await User.find({ _id: { $in: followingIds }, isDeleted: false })
      .select('username displayName profileImage isVerified bio');

    // Add isFollowing flag
    const enrichedFollowing = followingUsers.map(f => {
      const isFollowing = request.user
        ? (request.user.following || []).some(id => id.toString() === f._id.toString())
        : false;
      return { ...f.toObject(), isFollowing };
    });

    return apiSuccess({
      docs: enrichedFollowing,
      totalDocs: total,
      page,
      totalPages: Math.ceil(total / limit),
      hasNextPage: endIndex < total,
    });
  } catch (err) {
    console.error('[GET following]', err);
    return apiError('Failed to fetch following', 500);
  }
});
