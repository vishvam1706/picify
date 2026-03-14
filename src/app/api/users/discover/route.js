import dbConnect from '@/lib/db';
import User from '@/models/User';
import { withOptionalAuth, apiSuccess, apiError } from '@/lib/apiHelpers';

export const GET = withOptionalAuth(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 10;
    
    await dbConnect();

    const query = { 
      isCreator: true, 
      isActive: true, 
      isDeleted: false,
      'privacy.isPublic': true 
    };

    // Exclude self and already followed
    if (request.user) {
      query._id = { 
        $ne: request.user._id, 
        $nin: request.user.following 
      };
    }

    // Sort by follower count for discovery
    const creators = await User.find(query)
      .sort({ followersCount: -1 })
      .limit(limit)
      .select('username displayName profileImage bio followersCount');

    return apiSuccess(creators);
  } catch (err) {
    console.error('[GET discover]', err);
    return apiError('Failed to fetch creators', 500);
  }
});
