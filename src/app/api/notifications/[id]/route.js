import dbConnect from '@/lib/db';
import Notification from '@/models/Notification';
import { withAuth, apiSuccess, apiError } from '@/lib/apiHelpers';

export const PATCH = withAuth(async (request, { params }) => {
  try {
    await dbConnect();
    const { id } = await params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: request.user._id },
      { $set: { isRead: true } },
      { new: true }
    );

    if (!notification) return apiError('Notification not found', 404);

    return apiSuccess({ message: 'Notification marked as read', notification });
  } catch (err) {
    console.error('[PATCH notification]', err);
    return apiError('Failed to update notification', 500);
  }
});

export const DELETE = withAuth(async (request, { params }) => {
  try {
    await dbConnect();
    const { id } = await params;

    const notification = await Notification.findOneAndDelete({ 
      _id: id, 
      userId: request.user._id 
    });

    if (!notification) return apiError('Notification not found', 404);

    return apiSuccess({ message: 'Notification deleted' });
  } catch (err) {
    console.error('[DELETE notification]', err);
    return apiError('Failed to delete notification', 500);
  }
});
