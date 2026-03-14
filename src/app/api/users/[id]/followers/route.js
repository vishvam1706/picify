import dbConnect from '@/lib/db';
import User from '@/models/User';
import { withAuth, apiSuccess, apiError } from '@/lib/apiHelpers';

export const GET = withAuth(async (request, { params }) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    
    await dbConnect();
    const { id: targetUserId } = await params;
    
    const targetUser = await User.findById(targetUserId).select('privacy followers');
    if (!targetUser) return apiError('User not found', 404);

    // Privacy check
    if (!targetUser.privacy.showFollowers && 
        request.user._id.toString() !== targetUserId) {
      return apiError('This user\'s followers are private', 403);
    }

    // Manual basic pagination instead of mongoose-paginate for array fields
    const total = targetUser.followers.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    // Slice and populate
    const followerIds = targetUser.followers.slice(startIndex, endIndex);
    const followers = await User.find({ _id: { $in: followerIds }, isDeleted: false })
      .select('username displayName profileImage isVerified bio');

    // Add isFollowing flag for current user context
    const enrichedFollowers = followers.map(f => {
      const isFollowing = request.user.following.includes(f._id);
      return { ...f.toObject(), isFollowing };
    });

    return apiSuccess({
      docs: enrichedFollowers,
      totalDocs: total,
      page,
      totalPages: Math.ceil(total / limit),
      hasNextPage: endIndex < total,
    });
  } catch (err) {
    console.error('[GET followers]', err);
    return apiError('Failed to fetch followers', 500);
  }
});
