import dbConnect from '@/lib/db';
import Notification from '@/models/Notification';
import { withAuth, apiSuccess, apiError } from '@/lib/apiHelpers';

export const GET = withAuth(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    await dbConnect();

    const query = { userId: request.user._id };
    if (unreadOnly) {
      query.isRead = false;
    }

    const notifications = await Notification.paginate(query, {
      page,
      limit,
      sort: { createdAt: -1 },
      populate: { path: 'actorId', select: 'username displayName profileImage' },
      lean: true
    });

    return apiSuccess({
      docs: notifications.docs,
      totalDocs: notifications.totalDocs,
      page: notifications.page,
      totalPages: notifications.totalPages,
      hasNextPage: notifications.hasNextPage,
    });
  } catch (err) {
    console.error('[GET notifications]', err);
    return apiError('Failed to fetch notifications', 500);
  }
});

export const PATCH = withAuth(async (request) => {
  try {
    await dbConnect();
    // Mark ALL as read
    
    await Notification.updateMany(
      { userId: request.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    return apiSuccess({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('[PATCH mark all notifications]', err);
    return apiError('Failed to mark notifications as read', 500);
  }
});

export const DELETE = withAuth(async (request) => {
  try {
    await dbConnect();
    // Clear ALL notifications
    
    await Notification.deleteMany({ userId: request.user._id });

    return apiSuccess({ message: 'All notifications cleared' });
  } catch (err) {
    console.error('[DELETE all notifications]', err);
    return apiError('Failed to clear notifications', 500);
  }
});
