import dbConnect from '@/lib/db';
import WatchHistory from '@/models/WatchHistory';
import { withAuth, apiSuccess, apiError } from '@/lib/apiHelpers';

export const GET = withAuth(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;

    await dbConnect();

    // Find the latest history entry per Pin
    const history = await WatchHistory.aggregate([
      { $match: { userId: request.user._id } },
      { $sort: { viewedAt: -1 } },
      { $group: { _id: '$pinId', viewedAt: { $first: '$viewedAt' } } },
      { $sort: { viewedAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $lookup: {
          from: 'pins',
          localField: '_id',
          foreignField: '_id',
          as: 'pin',
        },
      },
      { $unwind: '$pin' },
      { $match: { 'pin.isDeleted': false } },
    ]);

    const totalGroups = await WatchHistory.aggregate([
      { $match: { userId: request.user._id } },
      { $group: { _id: '$pinId' } },
      { $count: 'total' }
    ]);
    const total = totalGroups[0]?.total || 0;

    return apiSuccess({
      docs: history,
      totalDocs: total,
      page,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
    });
  } catch (err) {
    console.error('[GET watch-history]', err);
    return apiError('Failed to fetch watch history', 500);
  }
});
