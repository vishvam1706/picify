import dbConnect from '@/lib/db';
import Board from '@/models/Board';
import Activity from '@/models/Activity';
import slugify from 'slugify';
import { withAuth, withOptionalAuth, apiSuccess, apiError } from '@/lib/apiHelpers';

export const POST = withAuth(async (request) => {
  try {
    await dbConnect();
    const body = await request.json();
    const { name, description, isPublic, isCollaborative, parentFolderId } = body;

    if (!name) return apiError('Board name is required', 400);

    const slug = slugify(name, { lower: true, strict: true }) + '-' + Math.random().toString(36).substring(2, 6);

    const board = await Board.create({
      userId: request.user._id,
      name,
      description,
      slug,
      isPublic: isPublic !== false,
      isCollaborative: !!isCollaborative,
      parentFolderId: parentFolderId || null,
      collaborators: isCollaborative ? [{ userId: request.user._id, role: 'editor' }] : []
    });

    if (board.isPublic) {
      await Activity.create({
        userId: request.user._id,
        type: 'board_created',
        entityId: board._id,
        entityType: 'board'
      });
    }

    if (parentFolderId) {
      const BoardFolder = (await import('@/models/BoardFolder')).default;
      await BoardFolder.findByIdAndUpdate(parentFolderId, { $inc: { boardsCount: 1 } });
    }

    return apiSuccess(board, 201);
  } catch (err) {
    console.error('[POST board create]', err);
    return apiError('Failed to create board', 500);
  }
});

export const GET = withOptionalAuth(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const folderId = searchParams.get('folderId') || null;
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    
    await dbConnect();

    // Default query: public boards of a user
    const query = { isDeleted: false, isPublic: true };
    
    if (userId && userId !== 'undefined') query.userId = userId;
    if (folderId !== null && folderId !== 'undefined') query.parentFolderId = folderId;

    // Viewing own boards -> can see private ones
    if (request.user && (!userId || request.user._id.toString() === userId)) {
      delete query.isPublic;
    }

    // Include collaborative boards where user is a collaborator
    if (request.user && (!userId || request.user._id.toString() === userId)) {
      const UserBoardsQuery = {
        $or: [
          query,
          { 'collaborators.userId': request.user._id, isDeleted: false }
        ]
      };
      
      const boards = await Board.paginate(UserBoardsQuery, {
        page,
        limit,
        sort: { updatedAt: -1 },
        populate: { path: 'userId', select: 'username displayName profileImage' },
        lean: true
      });
      return apiSuccess({ docs: boards.docs, ...boards });
    }

    // Standard pagination for public viewing
    const boards = await Board.paginate(query, {
      page,
      limit,
      sort: { updatedAt: -1 },
      populate: { path: 'userId', select: 'username displayName profileImage' },
      lean: true
    });

    return apiSuccess({
      docs: boards.docs,
      totalDocs: boards.totalDocs,
      page: boards.page,
      totalPages: boards.totalPages,
      hasNextPage: boards.hasNextPage,
    });
  } catch (err) {
    console.error('[GET boards]', err);
    return apiError('Failed to fetch boards', 500);
  }
});
