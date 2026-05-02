import dbConnect from '@/lib/db';
import SavedPin from '@/models/SavedPin';
import User from '@/models/User';
import { apiSuccess, apiError, withOptionalAuth } from '@/lib/apiHelpers';

export const GET = withOptionalAuth(async (request, { params }) => {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 50;
    const { id } = await params;

    await dbConnect();
    const targetUser = await User.findById(id).lean();
    if (!targetUser) return apiError('User not found', 404);

    const isOwner = request.user && request.user._id.toString() === targetUser._id.toString();

    if (!isOwner) {
      if (targetUser.privacy?.isPublic === false) return apiError('Profile is private', 403);
      if (targetUser.privacy?.showSavedPins === false) return apiError('Saved pins are private', 403);
    }

    const saved = await SavedPin.paginate({ userId: id }, {
      page: 1,
      limit,
      sort: { savedAt: -1 },
      populate: [
        { path: 'pinId', match: { isDeleted: false, isPublic: true } }
      ],
    });

    const validDocs = saved.docs.filter((doc) => doc.pinId !== null);

    return apiSuccess({ docs: validDocs });
  } catch (err) {
    console.error('[GET user saved-pins]', err);
    return apiError('Failed to fetch saved pins', 500);
  }
});
