import dbConnect from '@/lib/db';
import Pin from '@/models/Pin';
import { withOptionalAuth, apiSuccess, apiError } from '@/lib/apiHelpers';
import { getBlockedUserIds } from '@/lib/blockFilter';

export const GET = withOptionalAuth(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 24;
    const category = searchParams.get('category') || '';

    await dbConnect();

    // Fetch blocked user IDs for the current viewer (empty array for guests)
    const blockedIds = await getBlockedUserIds(request.user?._id);
    const blockedFilter = blockedIds.length > 0 ? { userId: { $nin: blockedIds } } : {};

    const baseQuery = {
      isPublic: true,
      isDeleted: false,
      isDraft: false,
      publishedAt: { $lte: new Date() },
      ...blockedFilter,
    };

    // Apply category filter when provided
    if (category) {
      baseQuery.categories = { $in: [category] };
    }

    // Personalized Explore Feed for logged-in users
    if (request.user && !category) {
      // 40% from users they follow (excluding blocked)
      const followingIds = (request.user.following || []).filter(id => !blockedIds.includes(id.toString()));
      const followingQuery = { ...baseQuery, userId: { $in: followingIds } };

      const followedPins = await Pin.find(followingQuery)
        .sort({ publishedAt: -1 })
        .limit(Math.floor(limit * 0.4))
        .populate('userId', 'username displayName profileImage')
        .lean();

      // 60% popular overall
      const popularPins = await Pin.find(baseQuery)
        .sort({ savesCount: -1, views: -1 })
        .limit(Math.floor(limit * 0.6))
        .populate('userId', 'username displayName profileImage')
        .lean();

      // Deduplicate & shuffle
      const seenIds = new Set(followedPins.map(p => p._id.toString()));
      const uniquePopular = popularPins.filter(p => !seenIds.has(p._id.toString()));
      const explorePins = [...followedPins, ...uniquePopular].sort(() => 0.5 - Math.random());

      const paginated = explorePins.slice((page - 1) * limit, page * limit);
      return apiSuccess({
        docs: paginated,
        hasNextPage: explorePins.length > page * limit,
        totalDocs: explorePins.length,
        page,
      });
    }

    // Category-filtered feed or guest feed: use paginate for proper pagination
    const pins = await Pin.paginate(baseQuery, {
      page,
      limit,
      sort: { savesCount: -1, views: -1, publishedAt: -1 },
      populate: { path: 'userId', select: 'username displayName profileImage' },
      lean: true,
    });

    return apiSuccess({
      docs: pins.docs,
      hasNextPage: pins.hasNextPage,
      totalDocs: pins.totalDocs,
      page: pins.page,
      totalPages: pins.totalPages,
    });
  } catch (err) {
    console.error('[GET explore pins]', err);
    return apiError('Failed to fetch explore feed', 500);
  }
});
