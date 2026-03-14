import dbConnect from '@/lib/db';
import Comment from '@/models/Comment';
import Pin from '@/models/Pin';
import Notification from '@/models/Notification';
import Activity from '@/models/Activity';
import { withAuth, withOptionalAuth, apiSuccess, apiError } from '@/lib/apiHelpers';

export const POST = withAuth(async (request, { params }) => {
  try {
    await dbConnect();
    const { id: pinId } = await params;
    const { text, parentCommentId, mentions = [] } = await request.json();

    if (!text || text.trim().length === 0) {
      return apiError('Comment text is required', 400);
    }

    const pin = await Pin.findOne({ _id: pinId, isDeleted: false });
    if (!pin) return apiError('Pin not found', 404);

    let parentComment = null;
    if (parentCommentId) {
      parentComment = await Comment.findOne({ _id: parentCommentId, pinId, isDeleted: false });
      if (!parentComment) return apiError('Parent comment not found', 404);
      // Optional: Prevent deep nesting (only allow 1 level of replies)
      if (parentComment.parentCommentId) {
        return apiError('Nested replies beyond 1 level are not supported', 400);
      }
    }

    const comment = await Comment.create({
      pinId,
      userId: request.user._id,
      text: text.trim(),
      parentCommentId: parentCommentId || null,
      mentions
    });

    // Update Counters
    if (parentCommentId) {
      await Comment.findByIdAndUpdate(parentCommentId, { $inc: { repliesCount: 1 } });
    } else {
      await Pin.findByIdAndUpdate(pinId, { $inc: { commentsCount: 1 } });
    }

    // Activity
    await Activity.create({
      userId: request.user._id,
      type: 'comment',
      entityId: comment._id,
      entityType: 'comment'
    });

    // Notifications
    // 1. Notify Pin Owner (if comment is top-level and not self)
    if (!parentCommentId && pin.userId.toString() !== request.user._id.toString()) {
      await Notification.create({
        userId: pin.userId,
        actorId: request.user._id,
        type: 'comment',
        entityId: comment._id,
        entityType: 'comment',
        message: `${request.user.displayName} commented on your pin`
      });
    }

    // 2. Notify Parent Comment Owner (if reply and not self)
    if (parentComment && parentComment.userId.toString() !== request.user._id.toString()) {
      await Notification.create({
        userId: parentComment.userId,
        actorId: request.user._id,
        type: 'comment',
        entityId: comment._id,
        entityType: 'comment',
        message: `${request.user.displayName} replied to your comment`
      });
    }

    // 3. Notify Mentions
    for (const mentionId of mentions) {
      if (mentionId !== request.user._id.toString()) {
        await Notification.create({
          userId: mentionId,
          actorId: request.user._id,
          type: 'mention',
          entityId: comment._id,
          entityType: 'comment',
          message: `${request.user.displayName} mentioned you in a comment`
        });
      }
    }

    // Populate user before return
    await comment.populate('userId', 'username displayName profileImage');

    return apiSuccess(comment, 201);
  } catch (err) {
    console.error('[POST pin comment]', err);
    return apiError('Failed to post comment', 500);
  }
});

export const GET = withOptionalAuth(async (request, { params }) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const parentCommentId = searchParams.get('parentId') || null;

    await dbConnect();
    const { id: pinId } = await params;

    const query = { pinId, isDeleted: false, parentCommentId };

    const comments = await Comment.paginate(query, {
      page,
      limit,
      sort: parentCommentId ? { createdAt: 1 } : { isPinned: -1, likesCount: -1, createdAt: -1 }, // Replies chronological, Root sorted by pin/likes
      populate: [
        { path: 'userId', select: 'username displayName profileImage isCreator' },
        { path: 'mentions', select: 'username displayName' }
      ]
    });

    // Attach `isLiked` boolean if logged in
    let docs = comments.docs.map(doc => {
      const isLiked = request.user ? doc.likes?.includes(request.user._id) : false;
      const docObj = doc.toObject();
      delete docObj.likes;
      return { ...docObj, isLiked };
    });

    return apiSuccess({ ...comments, docs });
  } catch (err) {
    console.error('[GET pin comments]', err);
    return apiError('Failed to fetch comments', 500);
  }
});
