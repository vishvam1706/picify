import dbConnect from '@/lib/db';
import Pin from '@/models/Pin';
import { withAuth, apiSuccess, apiError } from '@/lib/apiHelpers';

// GET /api/pins/scheduled — list user's scheduled (unpublished future) pins
export const GET = withAuth(async (request) => {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;

    const now = new Date();

    const pins = await Pin.paginate(
      {
        userId: request.user._id,
        isDeleted: false,
        isDraft: false,
        scheduledFor: { $gt: now },
      },
      {
        page,
        limit,
        sort: { scheduledFor: 1 },
        populate: { path: 'userId', select: 'username displayName profileImage' },
        lean: true,
      }
    );

    return apiSuccess({
      docs: pins.docs,
      totalDocs: pins.totalDocs,
      page: pins.page,
      totalPages: pins.totalPages,
      hasNextPage: pins.hasNextPage,
    });
  } catch (err) {
    console.error('[GET scheduled pins]', err);
    return apiError('Failed to fetch scheduled pins', 500);
  }
});
