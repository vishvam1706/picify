import dbConnect from '@/lib/db';
import Pin from '@/models/Pin';
import Board from '@/models/Board';
import { withOptionalAuth, apiSuccess, apiError } from '@/lib/apiHelpers';
import { getBlockedUserIds, applyBlockFilter } from '@/lib/blockFilter';

export const GET = withOptionalAuth(async (request, { params }) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;

    await dbConnect();
    const { id: boardId } = await params;

    const board = await Board.findOne({ _id: boardId, isDeleted: false });
    if (!board) return apiError('Board not found', 404);

    // Privacy logic
    if (!board.isPublic) {
      if (!request.user) return apiError('Board is private', 403);
      const isOwner = request.user._id.toString() === board.userId.toString();
      const isCollaborator = board.collaborators.some(c => c.userId.toString() === request.user._id.toString());
      if (!isOwner && !isCollaborator) return apiError('Board is private', 403);
    }

    let query = { boardId: board._id, isDeleted: false };
    
    // Only owner/collaborators see drafts in this board
    if (!request.user || 
        (request.user._id.toString() !== board.userId.toString() && 
         !board.collaborators.some(c => c.userId.toString() === request.user._id.toString()))) {
      query.isPublic = true;
      query.isDraft = false;
      query.publishedAt = { $lte: new Date() };
    }

    // Filter out pins from blocked users
    const blockedIds = await getBlockedUserIds(request.user?._id);
    query = applyBlockFilter(query, blockedIds);

    const pins = await Pin.paginate(query, {
      page,
      limit,
      sort: { publishedAt: -1, createdAt: -1 },
      populate: { path: 'userId', select: 'username displayName profileImage' },
      lean: true
    });

    return apiSuccess({
      docs: pins.docs,
      totalDocs: pins.totalDocs,
      page: pins.page,
      totalPages: pins.totalPages,
      hasNextPage: pins.hasNextPage,
    });
  } catch (err) {
    console.error('[GET board pins]', err);
    return apiError('Failed to fetch board pins', 500);
  }
});
