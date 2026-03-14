import dbConnect from '@/lib/db';
import Pin from '@/models/Pin';
import { withOptionalAuth, apiSuccess, apiError } from '@/lib/apiHelpers';

export const GET = withOptionalAuth(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 30;
    
    await dbConnect();

    const query = {
      isPublic: true,
      isDeleted: false,
      isDraft: false,
      publishedAt: { $lte: new Date() }
    };

    // Personalized Explore Feed
    if (request.user) {
      // Recommend pins based on users they follow
      const followingQuery = { ...query, userId: { $in: request.user.following } };
      
      const followedPins = await Pin.find(followingQuery)
        .sort({ publishedAt: -1 })
        .limit(Math.floor(limit * 0.4)) // 40% from following
        .populate('userId', 'username displayName profileImage')
        .lean();

      // Recommend popular pins overall
      const popularPins = await Pin.find(query)
        .sort({ savesCount: -1, views: -1 })
        .limit(Math.floor(limit * 0.6)) // 60% popular
        .populate('userId', 'username displayName profileImage')
        .lean();

      // Deduplicate
      const seenIds = new Set(followedPins.map(p => p._id.toString()));
      const uniquePopular = popularPins.filter(p => !seenIds.has(p._id.toString()));

      // Shuffle
      const explorePins = [...followedPins, ...uniquePopular].sort(() => 0.5 - Math.random());

      return apiSuccess({ docs: explorePins.slice(0, limit) });
    }

    // Guest Explore Feed: Just random highly-rated pins
    const guestPins = await Pin.aggregate([
      { $match: query },
      { $sample: { size: limit } }
    ]);

    await Pin.populate(guestPins, { path: 'userId', select: 'username displayName profileImage' });

    return apiSuccess({ docs: guestPins });
  } catch (err) {
    console.error('[GET explore pins]', err);
    return apiError('Failed to fetch explore feed', 500);
  }
});
