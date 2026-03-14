import dbConnect from '@/lib/db';
import Pin from '@/models/Pin';
import Activity from '@/models/Activity';
import Notification from '@/models/Notification';
import { withAuth, apiSuccess, apiError } from '@/lib/apiHelpers';

export const POST = withAuth(async (request, { params }) => {
  try {
    await dbConnect();
    const { id: pinId } = await params;
    const userId = request.user._id;

    const pin = await Pin.findOne({ _id: pinId, isDeleted: false });
    if (!pin) return apiError('Pin not found', 404);

    if (pin.likes.includes(userId)) {
      return apiSuccess({ message: 'Already liked' });
    }

    pin.likes.push(userId);
    pin.likesCount += 1;
    await pin.save();

    // Activity
    await Activity.create({
      userId,
      type: 'like',
      entityId: pinId,
      entityType: 'pin'
    });

    // Notify Pin Owner (if not self)
    if (pin.userId.toString() !== userId.toString()) {
      await Notification.create({
        userId: pin.userId,
        actorId: userId,
        type: 'like',
        entityId: pinId,
        entityType: 'pin',
        message: `${request.user.displayName} liked your pin`
      });
    }

    return apiSuccess({ message: 'Pin liked successfully' });
  } catch (err) {
    console.error('[POST pin like]', err);
    return apiError('Failed to like pin', 500);
  }
});

export const DELETE = withAuth(async (request, { params }) => {
  try {
    await dbConnect();
    const { id: pinId } = await params;
    const userId = request.user._id;

    const pin = await Pin.findOne({ _id: pinId, isDeleted: false });
    if (!pin) return apiError('Pin not found', 404);

    pin.likes.pull(userId);
    pin.likesCount = Math.max(0, pin.likesCount - 1);
    await pin.save();

    return apiSuccess({ message: 'Pin unliked successfully' });
  } catch (err) {
    console.error('[DELETE pin like]', err);
    return apiError('Failed to unlike pin', 500);
  }
});
