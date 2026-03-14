import dbConnect from '@/lib/db';
import Pin from '@/models/Pin';
import { withAuth, apiSuccess, apiError } from '@/lib/apiHelpers';

export const GET = withAuth(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const metric = searchParams.get('metric') || 'views'; // views, savesCount, likesCount
    const limit = parseInt(searchParams.get('limit')) || 5;

    await dbConnect();

    if (!request.user.isCreator) {
      return apiError('Analytics are only available for creator accounts', 403);
    }

    // Determine sort
    let sortObj = {};
    if (metric === 'saves') sortObj.savesCount = -1;
    else if (metric === 'likes') sortObj.likesCount = -1;
    else sortObj.views = -1;

    const topPins = await Pin.find({
      userId: request.user._id,
      isDeleted: false,
      isDraft: false
    })
    .sort(sortObj)
    .limit(limit)
    .select(`title images isPublic createdAt views savesCount likesCount commentsCount`);

    return apiSuccess(topPins);
  } catch (err) {
    console.error('[GET top pins analytics]', err);
    return apiError('Failed to fetch top pins', 500);
  }
});
