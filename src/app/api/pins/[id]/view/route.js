import dbConnect from '@/lib/db';
import Pin from '@/models/Pin';
import WatchHistory from '@/models/WatchHistory';
import { withOptionalAuth, apiSuccess, apiError } from '@/lib/apiHelpers';

export const POST = withOptionalAuth(async (request, { params }) => {
  try {
    await dbConnect();
    const { id: pinId } = await params;

    const pin = await Pin.findOne({ _id: pinId, isDeleted: false });
    if (!pin) return apiError('Pin not found', 404);

    pin.views += 1;

    // Track unique views per user (last 30 days logic is in the schema)
    if (request.user) {
      if (!pin.viewedBy.includes(request.user._id)) {
        pin.viewedBy.push(request.user._id);
      }
      
      // Update Watch History
      const filter = { userId: request.user._id, pinId: pin._id };
      const update = { viewedAt: new Date() };
      await WatchHistory.findOneAndUpdate(filter, update, { upsert: true });
    }

    await pin.save();

    return apiSuccess({ message: 'View recorded' });
  } catch (err) {
    console.error('[POST pin view]', err);
    return apiError('Failed to record view', 500);
  }
});
