import dbConnect from '@/lib/db';
import Board from '@/models/Board';
import { withAuth, apiSuccess, apiError } from '@/lib/apiHelpers';

// GET /api/boards/mine — returns only the logged-in user's own boards
export const GET = withAuth(async (request) => {
  try {
    await dbConnect();
    const userId = request.user._id;

    const boards = await Board.find({
      $or: [
        { userId, isDeleted: false },
        { 'collaborators.userId': userId, isDeleted: false }
      ]
    })
      .sort({ updatedAt: -1 })
      .select('_id name slug coverImage isPublic pinsCount')
      .lean();

    return apiSuccess(boards);
  } catch (err) {
    console.error('[GET /api/boards/mine]', err);
    return apiError('Failed to fetch boards', 500);
  }
});
