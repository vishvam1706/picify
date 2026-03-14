import dbConnect from '@/lib/db';
import Board from '@/models/Board';
import Pin from '@/models/Pin';
import { withAuth, withOptionalAuth, apiSuccess, apiError } from '@/lib/apiHelpers';

export const GET = withOptionalAuth(async (request, { params }) => {
  try {
    await dbConnect();
    const { id } = await params;

    const board = await Board.findOne({ _id: id, isDeleted: false })
      .populate('userId', 'username displayName profileImage')
      .populate('collaborators.userId', 'username displayName profileImage');

    if (!board) return apiError('Board not found', 404);

    // Privacy logic
    if (!board.isPublic) {
      if (!request.user) return apiError('Board is private', 403);
      const isOwner = request.user._id.toString() === board.userId._id.toString();
      const isCollaborator = board.collaborators.some(c => c.userId._id.toString() === request.user._id.toString());
      if (!isOwner && !isCollaborator) return apiError('Board is private', 403);
    }

    const User = (await import('@/models/User')).default;
    
    // Check if current user is following the board
    let isFollowing = false;
    if (request.user) {
      isFollowing = board.followers.includes(request.user._id);
    }

    const boardObj = board.toObject();
    delete boardObj.followers; // Hide full list

    // Provide 5 sample pins for a cover collage
    const samplePins = await Pin.find({ boardId: board._id, isPublic: true, isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('images')
      .lean();

    const sampleImages = samplePins.map(p => p.images[0]?.url).filter(Boolean);

    return apiSuccess({ ...boardObj, isFollowing, sampleImages });
  } catch (err) {
    console.error('[GET board]', err);
    return apiError('Failed to fetch board', 500);
  }
});

export const PATCH = withAuth(async (request, { params }) => {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    const board = await Board.findOne({ _id: id, isDeleted: false });
    if (!board) return apiError('Board not found', 404);

    // Only owner can update details
    if (board.userId.toString() !== request.user._id.toString()) {
      return apiError('Unauthorized', 403);
    }

    const allowedFields = ['name', 'description', 'isPublic', 'isCollaborative', 'parentFolderId', 'coverImage'];
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        board[field] = body[field];
      }
    }

    // Slug update if name changes
    if (body.name && body.name !== board.name) {
      const slugify = (await import('slugify')).default;
      board.slug = slugify(body.name, { lower: true, strict: true }) + '-' + Math.random().toString(36).substring(2, 6);
    }

    await board.save();

    return apiSuccess(board);
  } catch (err) {
    console.error('[PATCH board]', err);
    return apiError('Failed to update board', 500);
  }
});

export const DELETE = withAuth(async (request, { params }) => {
  try {
    await dbConnect();
    const { id } = await params;

    const board = await Board.findOne({ _id: id, userId: request.user._id, isDeleted: false });
    if (!board) return apiError('Board not found or unauthorized', 404);

    board.isDeleted = true;
    await board.save();

    // Decrement Folder Count if applicable
    if (board.parentFolderId) {
      const BoardFolder = (await import('@/models/BoardFolder')).default;
      await BoardFolder.findByIdAndUpdate(board.parentFolderId, { $inc: { boardsCount: -1 } });
    }

    // (Background job would normally untie or soft delete all Pins in this board)
    await Pin.updateMany({ boardId: board._id }, { boardId: null });

    return apiSuccess({ message: 'Board deleted successfully' });
  } catch (err) {
    console.error('[DELETE board]', err);
    return apiError('Failed to delete board', 500);
  }
});
