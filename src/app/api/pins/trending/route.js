import dbConnect from '@/lib/db';
import TrendingPin from '@/models/TrendingPin';
import { withOptionalAuth, apiSuccess, apiError } from '@/lib/apiHelpers';

export const GET = withOptionalAuth(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 20;
    const period = searchParams.get('period') || 'daily'; // hourly, daily, weekly
    const category = searchParams.get('category') || 'all';
    
    await dbConnect();

    // Fetch from Redis-backed trending collection
    const query = { period, category };

    const trendingRecords = await TrendingPin.find(query)
      .sort({ rank: 1 })
      .limit(limit)
      .populate({
        path: 'pinId',
        match: { isDeleted: false, isPublic: true },
        select: 'title images sourceLink userId likesCount savesCount',
        populate: { path: 'userId', select: 'username displayName profileImage' }
      })
      .lean();

    // Filter out null pinIds (if pin was deleted)
    const validPins = trendingRecords
      .filter(record => record.pinId !== null)
      .map(record => ({
        ...record.pinId,
        trendingScore: record.score,
        trendingRank: record.rank,
      }));

    return apiSuccess({ docs: validPins });
  } catch (err) {
    console.error('[GET trending pins]', err);
    return apiError('Failed to fetch trending pins', 500);
  }
});
