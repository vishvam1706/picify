import dbConnect from '@/lib/db';
import WatchHistory from '@/models/WatchHistory';
import { withAuth, apiSuccess, apiError } from '@/lib/apiHelpers';

// GET /api/watch-history — last 30 viewed pins
export const GET = withAuth(async (request) => {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit')) || 30, 50);

    const history = await WatchHistory.find({ userId: request.user._id })
      .sort({ viewedAt: -1 })
      .limit(limit)
      .populate({
        path: 'pinId',
        select: 'title images likesCount savesCount commentsCount views userId isDeleted',
        populate: { path: 'userId', select: 'username displayName profileImage' },
      })
      .lean();

    // Filter out deleted or null pins
    const filtered = history
      .filter((h) => h.pinId && !h.pinId.isDeleted)
      .map((h) => ({
        ...h.pinId,
        viewedAt: h.viewedAt,
      }));

    return apiSuccess({ docs: filtered, total: filtered.length });
  } catch (err) {
    console.error('[GET watch-history]', err);
    return apiError('Failed to fetch watch history', 500);
  }
});

// DELETE /api/watch-history — clear all history
export const DELETE = withAuth(async (request) => {
  try {
    await dbConnect();
    await WatchHistory.deleteMany({ userId: request.user._id });
    return apiSuccess({ message: 'Watch history cleared' });
  } catch (err) {
    console.error('[DELETE watch-history]', err);
    return apiError('Failed to clear watch history', 500);
  }
});
