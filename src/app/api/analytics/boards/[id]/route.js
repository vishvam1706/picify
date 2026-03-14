import dbConnect from '@/lib/db';
import Board from '@/models/Board';
import Pin from '@/models/Pin';
import { withAuth, apiSuccess, apiError } from '@/lib/apiHelpers';

// GET /api/analytics/boards/[id]
export const GET = withAuth(async (request, { params }) => {
  try {
    const { id } = await params;
    await dbConnect();

    const board = await Board.findById(id);
    if (!board) return apiError('Board not found', 404);

    // Only owner or admin can see analytics
    if (board.userId.toString() !== request.user._id.toString() && request.user.role !== 'admin') {
      return apiError('Forbidden', 403);
    }

    // Get all pins in this board
    const pinsInBoard = await Pin.find({ boardId: id });

    // Aggregate stats from pins
    const stats = pinsInBoard.reduce((acc, pin) => {
      acc.totalViews += (pin.viewsCount || 0);
      acc.totalLikes += (pin.likesCount || 0);
      acc.totalSaves += (pin.savesCount || 0);
      acc.totalComments += (pin.commentsCount || 0);
      return acc;
    }, { totalViews: 0, totalLikes: 0, totalSaves: 0, totalComments: 0, pinCount: pinsInBoard.length });

    return apiSuccess({ boardId: id, stats });
  } catch (err) {
    console.error('[GET analytics/boards]', err);
    return apiError('Failed to fetch board analytics', 500);
  }
});
