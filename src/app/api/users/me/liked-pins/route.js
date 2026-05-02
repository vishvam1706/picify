import dbConnect from '@/lib/db';
import Pin from '@/models/Pin';
import { withAuth, apiSuccess, apiError } from '@/lib/apiHelpers';

export const GET = withAuth(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;

    await dbConnect();

    // Find pins where the current user's ID is in the "likes" array
    const query = { likes: request.user._id, isDeleted: false };

    const pins = await Pin.paginate(query, {
      page,
      limit,
      sort: { createdAt: -1 }, // Mongoose doesn't track when a specific array item was added by default, so we sort by pin creation, or we can just leave it as is
      populate: [
        { path: 'userId', select: 'username displayName profileImage isVerified' },
      ],
      lean: true,
    });

    return apiSuccess({
      docs: pins.docs,
      totalDocs: pins.totalDocs,
      page: pins.page,
      totalPages: pins.totalPages,
      hasNextPage: pins.hasNextPage,
    });
  } catch (err) {
    console.error('[GET liked-pins]', err);
    return apiError('Failed to fetch liked pins', 500);
  }
});
