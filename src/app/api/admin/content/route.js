import dbConnect from '@/lib/db';
import Pin from '@/models/Pin';
import Board from '@/models/Board';
import AdminLog from '@/models/AdminLog';
import { withAdmin, apiSuccess, apiError } from '@/lib/apiHelpers';

// GET /api/admin/content — list all pins/boards for moderation
export const GET = withAdmin(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const type = searchParams.get('type') || 'pins'; // 'pins' | 'boards'
    const flagged = searchParams.get('flagged') === 'true';

    await dbConnect();

    if (type === 'boards') {
      const query = { isDeleted: false };
      if (flagged) query.isFlagged = true;
      const boards = await Board.paginate(query, {
        page, limit,
        sort: { createdAt: -1 },
        populate: [{ path: 'userId', select: 'username displayName' }]
      });
      return apiSuccess({ type: 'boards', docs: boards.docs, totalDocs: boards.totalDocs, totalPages: boards.totalPages, hasNextPage: boards.hasNextPage });
    }

    // Default: pins
    const query = { isDeleted: false };
    if (flagged) query.isFlagged = true;
    const pins = await Pin.paginate(query, {
      page, limit,
      sort: { createdAt: -1 },
      populate: [{ path: 'userId', select: 'username displayName profileImage' }]
    });

    return apiSuccess({ type: 'pins', docs: pins.docs, totalDocs: pins.totalDocs, totalPages: pins.totalPages, hasNextPage: pins.hasNextPage });
  } catch (err) {
    console.error('[GET admin/content]', err);
    return apiError('Failed to fetch content', 500);
  }
});

// DELETE /api/admin/content/[id]?type=pin|board
export const DELETE = withAdmin(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type') || 'pin';

    if (!id) return apiError('Content ID required', 400);

    await dbConnect();

    let doc;
    if (type === 'board') {
      doc = await Board.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    } else {
      doc = await Pin.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    }

    if (!doc) return apiError('Content not found', 404);

    await AdminLog.create({
      adminId: request.user._id,
      action: 'DELETE_CONTENT',
      targetId: id,
      targetModel: type === 'board' ? 'Board' : 'Pin',
      details: { type, reason: 'Removed by admin' }
    });

    return apiSuccess({ message: `${type} removed` });
  } catch (err) {
    console.error('[DELETE admin/content]', err);
    return apiError('Failed to delete content', 500);
  }
});
