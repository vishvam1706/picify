import dbConnect from '@/lib/db';
import TrendingPin from '@/models/TrendingPin';
import Pin from '@/models/Pin';
import { withOptionalAuth, apiSuccess, apiError } from '@/lib/apiHelpers';

export const GET = withOptionalAuth(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 48;
    const period = searchParams.get('period') || 'daily';
    const category = searchParams.get('category') || 'all';
    const page = parseInt(searchParams.get('page')) || 1;

    await dbConnect();

    // Try to load from dedicated TrendingPin collection first
    const query = { period, category };
    const trendingRecords = await TrendingPin.find(query)
      .sort({ rank: 1 })
      .limit(limit)
      .populate({
        path: 'pinId',
        match: { isDeleted: false, isPublic: true },
        select: 'title images sourceLink userId likesCount savesCount views',
        populate: { path: 'userId', select: 'username displayName profileImage' }
      })
      .lean();

    const validPins = trendingRecords
      .filter(r => r.pinId !== null)
      .map(r => ({ ...r.pinId, trendingScore: r.score, trendingRank: r.rank }));

    // ── Fallback: query Pin directly by recent engagement ──────────────────
    if (validPins.length === 0) {
      const since = new Date();
      since.setDate(since.getDate() - 7); // last 7 days

      const pinQuery = {
        isPublic: true,
        isDeleted: false,
        isDraft: false,
        publishedAt: { $gte: since, $lte: new Date() },
      };
      if (category && category !== 'all') {
        pinQuery.categories = { $in: [category] };
      }

      const fallbackPins = await Pin.paginate(pinQuery, {
        page,
        limit,
        sort: { likesCount: -1, savesCount: -1, views: -1, publishedAt: -1 },
        populate: { path: 'userId', select: 'username displayName profileImage' },
        lean: true,
      });

      return apiSuccess({
        docs: fallbackPins.docs,
        hasNextPage: fallbackPins.hasNextPage,
        totalDocs: fallbackPins.totalDocs,
        page: fallbackPins.page,
        isFallback: true,
      });
    }

    return apiSuccess({
      docs: validPins,
      hasNextPage: false,
      totalDocs: validPins.length,
      page: 1,
      isFallback: false,
    });
  } catch (err) {
    console.error('[GET trending pins]', err);
    return apiError('Failed to fetch trending pins', 500);
  }
});
