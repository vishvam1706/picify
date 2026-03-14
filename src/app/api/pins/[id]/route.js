import dbConnect from '@/lib/db';
import Pin from '@/models/Pin';
import Board from '@/models/Board';
import { withAuth, withOptionalAuth, apiSuccess, apiError } from '@/lib/apiHelpers';
import { deleteAsset } from '@/lib/cloudinary';

export const GET = withOptionalAuth(async (request, { params }) => {
  try {
    await dbConnect();
    const { id } = await params;

    const pin = await Pin.findOne({ _id: id, isDeleted: false })
      .populate('userId', 'username displayName profileImage isVerified followersCount')
      .populate('boardId', 'name slug isPublic');

    if (!pin) return apiError('Pin not found', 404);

    // Privacy & Draft checks
    if (!pin.isPublic && (!request.user || request.user._id.toString() !== pin.userId._id.toString())) {
      return apiError('This pin is private', 403);
    }

    if (pin.isDraft && (!request.user || request.user._id.toString() !== pin.userId._id.toString())) {
      return apiError('Pin not found', 404);
    }

    // Determine user interaction state
    let isSaved = false;
    let isLiked = false;
    let isFollowing = false;
    if (request.user) {
      isLiked = pin.likes.includes(request.user._id);

      const SavedPin = (await import('@/models/SavedPin')).default;
      const savedObj = await SavedPin.findOne({ userId: request.user._id, pinId: pin._id });
      isSaved = !!savedObj;

      // Check if current user follows the pin author
      const User = (await import('@/models/User')).default;
      const currentUser = await User.findById(request.user._id, 'following');
      isFollowing = currentUser?.following?.some(
        f => f.toString() === pin.userId._id.toString()
      ) ?? false;
    }

    // Clone to manipulate securely
    const pinObj = pin.toObject();
    delete pinObj.likes;
    delete pinObj.saves;
    // Attach isFollowing to the author object
    pinObj.userId = { ...pinObj.userId, isFollowing };

    return apiSuccess({ ...pinObj, isSaved, isLiked });
  } catch (err) {
    console.error('[GET pin]', err);
    return apiError('Failed to fetch pin', 500);
  }
});

export const PATCH = withAuth(async (request, { params }) => {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    const pin = await Pin.findOne({ _id: id, userId: request.user._id, isDeleted: false });
    if (!pin) return apiError('Pin not found or unauthorized', 404);

    const allowedFields = ['title', 'description', 'sourceLink', 'boardId', 'isPublic', 'isDraft', 'tags', 'categories'];
    
    const oldBoardId = pin.boardId;
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'tags' && Array.isArray(body[field])) {
          pin.tags = body[field].map(t => t.toLowerCase().trim());
        } else {
          pin[field] = body[field];
        }
      }
    }

    // Publish logic
    if (pin.isDraft === false && !pin.publishedAt) {
      pin.publishedAt = new Date();
    }

    await pin.save();

    // Adjust board counts if board changed
    if (body.boardId !== undefined && String(oldBoardId) !== String(body.boardId)) {
      if (oldBoardId) await Board.findByIdAndUpdate(oldBoardId, { $inc: { pinsCount: -1 } });
      if (body.boardId) await Board.findByIdAndUpdate(body.boardId, { $inc: { pinsCount: 1 } });
    }

    return apiSuccess(pin);
  } catch (err) {
    console.error('[PATCH pin]', err);
    return apiError('Failed to update pin', 500);
  }
});

export const DELETE = withAuth(async (request, { params }) => {
  try {
    await dbConnect();
    const { id } = await params;

    const pin = await Pin.findOne({ _id: id, userId: request.user._id, isDeleted: false });
    if (!pin) return apiError('Pin not found or unauthorized', 404);

    // Soft delete
    pin.isDeleted = true;
    await pin.save();

    // Cleanup count from board
    if (pin.boardId) {
      await Board.findByIdAndUpdate(pin.boardId, { $inc: { pinsCount: -1 } });
    }

    // Delete assets from Cloudinary (async)
    pin.images.forEach(img => {
      if (img.publicId) deleteAsset(img.publicId).catch(console.error);
    });

    return apiSuccess({ message: 'Pin deleted successfully' });
  } catch (err) {
    console.error('[DELETE pin]', err);
    return apiError('Failed to delete pin', 500);
  }
});
