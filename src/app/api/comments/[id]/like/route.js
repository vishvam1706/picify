import dbConnect from '@/lib/db';
import Comment from '@/models/Comment';
import Notification from '@/models/Notification';
import Activity from '@/models/Activity';
import { withAuth, apiSuccess, apiError } from '@/lib/apiHelpers';

export const POST = withAuth(async (request, { params }) => {
  try {
    await dbConnect();
    const { id: commentId } = await params;
    const userId = request.user._id;

    const comment = await Comment.findOne({ _id: commentId, isDeleted: false });
    if (!comment) return apiError('Comment not found', 404);

    if (comment.likes.includes(userId)) {
      return apiSuccess({ message: 'Already liked' });
    }

    comment.likes.push(userId);
    comment.likesCount += 1;
    await comment.save();

    await Activity.create({
      userId,
      type: 'like',
      entityId: commentId,
      entityType: 'comment'
    });

    if (comment.userId.toString() !== userId.toString()) {
      await Notification.create({
        userId: comment.userId,
        actorId: userId,
        type: 'like',
        entityId: commentId,
        entityType: 'comment',
        message: `${request.user.displayName} liked your comment`
      });
    }

    return apiSuccess({ message: 'Comment liked' });
  } catch (err) {
    console.error('[POST comment like]', err);
    return apiError('Failed to like comment', 500);
  }
});

export const DELETE = withAuth(async (request, { params }) => {
  try {
    await dbConnect();
    const { id: commentId } = await params;
    const userId = request.user._id;

    const comment = await Comment.findOne({ _id: commentId, isDeleted: false });
    if (!comment) return apiError('Comment not found', 404);

    comment.likes.pull(userId);
    comment.likesCount = Math.max(0, comment.likesCount - 1);
    await comment.save();

    return apiSuccess({ message: 'Comment unliked' });
  } catch (err) {
    console.error('[DELETE comment like]', err);
    return apiError('Failed to unlike comment', 500);
  }
});
