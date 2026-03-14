import dbConnect from '@/lib/db';
import User from '@/models/User';
import Board from '@/models/Board';
import { withOptionalAuth, apiSuccess, apiError } from '@/lib/apiHelpers';

// GET /api/users/profile?username=[username]
export const GET = withOptionalAuth(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) return apiError('Username is required', 400);

    await dbConnect();

    const targetUser = await User.findOne({ username, isDeleted: false })
      .select('-password -twoFactorSecret')
      .lean();

    if (!targetUser) return apiError('User not found', 404);

    let isFollowing = false;
    const isOwner = request.user && request.user._id.toString() === targetUser._id.toString();

    if (request.user) {
      isFollowing = targetUser.followers?.some(id => id.toString() === request.user._id.toString());
    }

    // Fetch the user's boards
    const boardQuery = { userId: targetUser._id };
    if (!isOwner) {
      boardQuery.isPrivate = { $ne: true }; // Hide private boards from public viewers
    }
    const boards = await Board.find(boardQuery).lean();

    return apiSuccess({
      ...targetUser,
      boards,
      isFollowing
    });

  } catch (err) {
    console.error('[GET users/profile]', err);
    return apiError('Failed to fetch user', 500);
  }
});
