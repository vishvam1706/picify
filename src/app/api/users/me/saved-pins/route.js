import dbConnect from '@/lib/db';
import SavedPin from '@/models/SavedPin';
import { withAuth, apiSuccess, apiError } from '@/lib/apiHelpers';

export const GET = withAuth(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const boardId = searchParams.get('boardId');

    await dbConnect();

    const query = { userId: request.user._id };
    if (boardId) query.boardId = boardId;

    const saved = await SavedPin.paginate(query, {
      page,
      limit,
      sort: { savedAt: -1 },
      populate: [
        { path: 'pinId', match: { isDeleted: false } },
        { path: 'boardId', select: 'name slug' }
      ],
    });

    // Filter out saved records where the underlying pin was deleted
    const validDocs = saved.docs.filter((doc) => doc.pinId !== null);

    return apiSuccess({
      docs: validDocs,
      totalDocs: validDocs.length, // approximate if some were deleted
      page: saved.page,
      totalPages: saved.totalPages,
      hasNextPage: saved.hasNextPage,
    });
  } catch (err) {
    console.error('[GET saved-pins]', err);
    return apiError('Failed to fetch saved pins', 500);
  }
});
