import dbConnect from '@/lib/db';
import Comment from '@/models/Comment';
import Pin from '@/models/Pin';
import { withAuth, apiSuccess, apiError } from '@/lib/apiHelpers';

export const PATCH = withAuth(async (request, { params }) => {
  try {
    await dbConnect();
    const { id } = await params;
    const { text, mentions } = await request.json();

    if (!text || text.trim().length === 0) {
      return apiError('Comment text is required', 400);
    }

    const comment = await Comment.findOne({ _id: id, userId: request.user._id, isDeleted: false });
    if (!comment) return apiError('Comment not found or unauthorized', 404);

    comment.text = text.trim();
    if (mentions) comment.mentions = mentions;
    
    await comment.save();

    return apiSuccess(comment);
  } catch (err) {
    console.error('[PATCH comment]', err);
    return apiError('Failed to update comment', 500);
  }
});

export const DELETE = withAuth(async (request, { params }) => {
  try {
    await dbConnect();
    const { id } = await params;

    const comment = await Comment.findOne({ _id: id, isDeleted: false });
    if (!comment) return apiError('Comment not found', 404);

    const pin = await Pin.findById(comment.pinId);

    // Can be deleted by author OR pin owner
    if (comment.userId.toString() !== request.user._id.toString() &&
        pin?.userId.toString() !== request.user._id.toString()) {
      return apiError('Unauthorized to delete this comment', 403);
    }

    // Soft delete
    comment.isDeleted = true;
    await comment.save();

    // Soft delete all replies cascaded
    await Comment.updateMany(
      { parentCommentId: comment._id, isDeleted: false },
      { $set: { isDeleted: true } }
    );

    // Adjust counters
    if (comment.parentCommentId) {
      await Comment.findByIdAndUpdate(comment.parentCommentId, { $inc: { repliesCount: -1 } });
    } else {
      if (pin) await Pin.findByIdAndUpdate(pin._id, { $inc: { commentsCount: -1 } });
    }

    return apiSuccess({ message: 'Comment deleted successfully' });
  } catch (err) {
    console.error('[DELETE comment]', err);
    return apiError('Failed to delete comment', 500);
  }
});
