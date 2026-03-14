import dbConnect from '@/lib/db';
import Board from '@/models/Board';
import { withAuth, apiSuccess, apiError } from '@/lib/apiHelpers';

export const DELETE = withAuth(async (request, { params }) => {
  try {
    await dbConnect();
    const { id: boardId, userId: targetUserId } = await params;

    const board = await Board.findOne({ _id: boardId, isDeleted: false });
    if (!board) return apiError('Board not found', 404);

    // Can only be removed by board Owner, or the user removing themselves
    if (board.userId.toString() !== request.user._id.toString() && request.user._id.toString() !== targetUserId) {
      return apiError('Unauthorized', 403);
    }

    const colIndex = board.collaborators.findIndex(c => c.userId.toString() === targetUserId);
    if (colIndex === -1) {
      return apiError('User is not a collaborator on this board', 404);
    }

    board.collaborators.splice(colIndex, 1);
    await board.save();

    return apiSuccess({ message: 'Collaborator removed successfully' });
  } catch (err) {
    console.error('[DELETE board collab]', err);
    return apiError('Failed to remove collaborator', 500);
  }
});
