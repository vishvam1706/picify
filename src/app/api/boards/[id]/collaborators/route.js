import dbConnect from '@/lib/db';
import Board from '@/models/Board';
import User from '@/models/User';
import Notification from '@/models/Notification';
import { withAuth, apiSuccess, apiError } from '@/lib/apiHelpers';

export const POST = withAuth(async (request, { params }) => {
  try {
    await dbConnect();
    const { id: boardId } = await params;
    const { targetUserId, role = 'editor' } = await request.json();

    if (!targetUserId) return apiError('Target user ID is required', 400);

    const board = await Board.findOne({ _id: boardId, isDeleted: false });
    if (!board) return apiError('Board not found', 404);

    if (board.userId.toString() !== request.user._id.toString()) {
      return apiError('Only the board owner can manage collaborators', 403);
    }
    
    if (!board.isCollaborative) {
      return apiError('This board is not marked as collaborative', 400);
    }

    const targetUser = await User.findOne({ _id: targetUserId, isActive: true, isDeleted: false });
    if (!targetUser) return apiError('Target user not found', 404);

    if (board.userId.toString() === targetUserId) {
      return apiError('You are already the owner', 400);
    }

    const exists = board.collaborators.find(c => c.userId.toString() === targetUserId);
    if (exists) {
      if (exists.role !== role) {
        exists.role = role; // Update role
        await board.save();
        return apiSuccess({ message: 'Collaborator role updated' });
      }
      return apiSuccess({ message: 'User is already a collaborator' });
    }

    board.collaborators.push({ userId: targetUserId, role, addedAt: new Date() });
    await board.save();

    await Notification.create({
      userId: targetUserId,
      actorId: request.user._id,
      type: 'collab_invite',
      entityId: board._id,
      entityType: 'board',
      message: `${request.user.displayName} added you as a collaborator to "${board.name}"`
    });

    return apiSuccess({ message: 'Collaborator added successfully' });
  } catch (err) {
    console.error('[POST board collab]', err);
    return apiError('Failed to add collaborator', 500);
  }
});
