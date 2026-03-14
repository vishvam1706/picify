import dbConnect from '@/lib/db';
import Board from '@/models/Board';
import Activity from '@/models/Activity';
import Notification from '@/models/Notification';
import { withAuth, apiSuccess, apiError } from '@/lib/apiHelpers';

export const POST = withAuth(async (request, { params }) => {
  try {
    await dbConnect();
    const { id: boardId } = await params;
    const userId = request.user._id;

    const board = await Board.findOne({ _id: boardId, isDeleted: false });
    if (!board) return apiError('Board not found', 404);

    if (!board.isPublic && board.userId.toString() !== userId.toString()) {
      return apiError('Cannot follow a private board', 403);
    }

    if (board.userId.toString() === userId.toString()) {
      return apiError('You cannot follow your own board', 400);
    }

    if (board.followers.includes(userId)) {
      return apiSuccess({ message: 'Already following board' });
    }

    board.followers.push(userId);
    board.followersCount += 1;
    await board.save();

    await Activity.create({
      userId,
      type: 'follow',
      entityId: boardId,
      entityType: 'board'
    });

    await Notification.create({
      userId: board.userId,
      actorId: userId,
      type: 'follow',
      entityId: boardId,
      entityType: 'board',
      message: `${request.user.displayName} started following your board "${board.name}"`
    });

    return apiSuccess({ message: 'Board followed successfully' });
  } catch (err) {
    console.error('[POST board follow]', err);
    return apiError('Failed to follow board', 500);
  }
});

export const DELETE = withAuth(async (request, { params }) => {
  try {
    await dbConnect();
    const { id: boardId } = await params;
    const userId = request.user._id;

    const board = await Board.findOne({ _id: boardId, isDeleted: false });
    if (!board) return apiError('Board not found', 404);

    board.followers.pull(userId);
    board.followersCount = Math.max(0, board.followersCount - 1);
    await board.save();

    return apiSuccess({ message: 'Board unfollowed successfully' });
  } catch (err) {
    console.error('[DELETE board follow]', err);
    return apiError('Failed to unfollow board', 500);
  }
});
