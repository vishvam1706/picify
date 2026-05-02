import dbConnect from '@/lib/db';
import Pin from '@/models/Pin';
import Board from '@/models/Board';
import { withAuth, apiSuccess, apiError } from '@/lib/apiHelpers';

export const GET = withAuth(async (request) => {
  try {
    await dbConnect();
    const userId = request.user._id;

    const [pinsData, boardsData] = await Promise.all([
      Pin.find({ userId, isDeleted: false })
        .sort({ createdAt: -1 })
        .limit(100)
        .select('title images likesCount savesCount commentsCount views createdAt')
        .lean(),
      Board.countDocuments({ userId, isDeleted: false }),
    ]);

    const totalLikes = pinsData.reduce((s, p) => s + (p.likesCount || 0), 0);
    const totalSaves = pinsData.reduce((s, p) => s + (p.savesCount || 0), 0);
    const totalViews = pinsData.reduce((s, p) => s + (p.views || 0), 0);
    const totalComments = pinsData.reduce((s, p) => s + (p.commentsCount || 0), 0);

    // Normalize image field
    const topPins = pinsData
      .sort((a, b) => ((b.views || 0) + (b.likesCount || 0) * 3 + (b.savesCount || 0) * 5) -
                      ((a.views || 0) + (a.likesCount || 0) * 3 + (a.savesCount || 0) * 5))
      .slice(0, 10)
      .map(p => ({
        ...p,
        thumbnail: p.images?.[0]?.url || null,
      }));

    return apiSuccess({
      totalPins: pinsData.length,
      totalBoards: boardsData,
      totalViews,
      totalLikes,
      totalSaves,
      totalComments,
      topPins,
    });
  } catch (err) {
    console.error('[GET analytics overview]', err);
    return apiError('Failed to fetch analytics', 500);
  }
});
