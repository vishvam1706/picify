import dbConnect from '@/lib/db';
import Comment from '@/models/Comment';
import Pin from '@/models/Pin';
import { withAuth, apiSuccess, apiError } from '@/lib/apiHelpers';

export const POST = withAuth(async (request, { params }) => {
  try {
    await dbConnect();
    const { id: commentId } = await params;

    const comment = await Comment.findOne({ _id: commentId, isDeleted: false });
    if (!comment) return apiError('Comment not found', 404);

    const pin = await Pin.findById(comment.pinId);
    if (!pin) return apiError('Associated pin not found', 404);

    // Only the Pin owner can pin a comment
    if (pin.userId.toString() !== request.user._id.toString()) {
      return apiError('Only the pin owner can pin comments', 403);
    }

    // Toggle pin status
    comment.isPinned = !comment.isPinned;
    await comment.save();

    return apiSuccess({ 
      message: comment.isPinned ? 'Comment pinned successfully' : 'Comment unpinned successfully',
      isPinned: comment.isPinned
    });
  } catch (err) {
    console.error('[POST comment pin]', err);
    return apiError('Failed to pin comment', 500);
  }
});
