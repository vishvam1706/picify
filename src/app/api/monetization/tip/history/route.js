import dbConnect from '@/lib/db';
import Earnings from '@/models/Earnings';
import { withAuth, apiSuccess, apiError } from '@/lib/apiHelpers';

// GET /api/monetization/tip/history — Tips sent BY the current user (fromUserId)
export const GET = withAuth(async (request) => {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const skip = (page - 1) * limit;

    const [tips, total] = await Promise.all([
      Earnings.find({ fromUserId: request.user._id, type: 'tip', status: 'completed' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'username displayName profileImage isVerified')
        .populate('pinId', 'title images')
        .lean(),
      Earnings.countDocuments({ fromUserId: request.user._id, type: 'tip', status: 'completed' }),
    ]);

    return apiSuccess({
      docs: tips,
      totalDocs: total,
      page,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
    });
  } catch (err) {
    console.error('[GET tip history]', err);
    return apiError('Failed to fetch tip history', 500);
  }
});
