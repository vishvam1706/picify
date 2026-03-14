import dbConnect from '@/lib/db';
import Pin from '@/models/Pin';
import SavedPin from '@/models/SavedPin';
import Board from '@/models/Board';
import Activity from '@/models/Activity';
import Notification from '@/models/Notification';
import { withAuth, apiSuccess, apiError } from '@/lib/apiHelpers';

export const POST = withAuth(async (request, { params }) => {
  try {
    await dbConnect();
    const { id: pinId } = await params;
    let boardId = null;
    try {
      const text = await request.text();
      if (text) boardId = JSON.parse(text)?.boardId ?? null;
    } catch { /* no body or invalid JSON is fine */ }
    const userId = request.user._id;

    const pin = await Pin.findOne({ _id: pinId, isDeleted: false });
    if (!pin) return apiError('Pin not found', 404);

    // Validate board ownership if provided
    if (boardId) {
      const board = await Board.findOne({ _id: boardId, userId, isDeleted: false });
      if (!board) return apiError('Board not found or unauthorized', 403);
    }

    // Check if duplicate save
    const existing = await SavedPin.findOne({ userId, pinId });
    if (existing) {
      if (boardId && existing.boardId?.toString() !== boardId) {
        // Move to new board
        existing.boardId = boardId;
        await existing.save();
        return apiSuccess({ message: 'Pin moved to new board' });
      }
      return apiSuccess({ message: 'Pin already saved' });
    }

    // Create Save record
    await SavedPin.create({ userId, pinId, boardId: boardId || null });

    // Update counters
    pin.savesCount += 1;
    await pin.save();
    
    if (boardId) {
      await Board.findByIdAndUpdate(boardId, { $inc: { pinsCount: 1 } });
    }

    // Activity
    await Activity.create({
      userId,
      type: 'save',
      entityId: pinId,
      entityType: 'pin'
    });

    // Notify Pin Owner (if not self)
    if (pin.userId.toString() !== userId.toString()) {
      await Notification.create({
        userId: pin.userId,
        actorId: userId,
        type: 'pin_saved',
        entityId: pinId,
        entityType: 'pin',
        message: `${request.user.displayName} saved your pin`
      });
    }

    return apiSuccess({ message: 'Pin saved successfully' }, 201);
  } catch (err) {
    if (err.code === 11000) return apiSuccess({ message: 'Pin already saved' });
    console.error('[POST pin save]', err);
    return apiError('Failed to save pin', 500);
  }
});

export const DELETE = withAuth(async (request, { params }) => {
  try {
    await dbConnect();
    const { id: pinId } = await params;
    const userId = request.user._id;

    const savedRecord = await SavedPin.findOneAndDelete({ userId, pinId });
    if (!savedRecord) {
      return apiError('Pin is not saved by you', 404);
    }

    // Update counters
    await Pin.findByIdAndUpdate(pinId, { $inc: { savesCount: -1 } });
    
    if (savedRecord.boardId) {
      await Board.findByIdAndUpdate(savedRecord.boardId, { $inc: { pinsCount: -1 } });
    }

    return apiSuccess({ message: 'Pin unsaved successfully' });
  } catch (err) {
    console.error('[DELETE pin save]', err);
    return apiError('Failed to unsave pin', 500);
  }
});
