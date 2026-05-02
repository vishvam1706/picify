import dbConnect from '@/lib/db';
import User from '@/models/User';
import Pin from '@/models/Pin';
import Board from '@/models/Board';
import Comment from '@/models/Comment';
import { withAdmin, apiSuccess, apiError } from '@/lib/apiHelpers';

// GET /api/admin/export — export platform data as JSON
export const GET = withAdmin(async (request) => {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'users'; // users | pins | boards | comments

    let data;
    const limit = 1000;

    if (type === 'users') {
      data = await User.find({ isDeleted: false })
        .select('-password -twoFactorSecret -emailVerifyToken -resetPasswordToken')
        .limit(limit).lean();
    } else if (type === 'pins') {
      data = await Pin.find({ isDeleted: false })
        .select('title description tags categories isPublic isDraft isNSFW views likesCount savesCount commentsCount createdAt userId')
        .populate('userId', 'username')
        .limit(limit).lean();
    } else if (type === 'boards') {
      data = await Board.find({ isDeleted: false })
        .select('name description isPublic isCollaborative pinsCount followersCount createdAt userId')
        .populate('userId', 'username')
        .limit(limit).lean();
    } else if (type === 'comments') {
      data = await Comment.find({ isDeleted: false })
        .select('text userId pinId isReported createdAt')
        .populate('userId', 'username')
        .limit(limit).lean();
    } else {
      return apiError('Invalid export type', 400);
    }

    return apiSuccess({ type, count: data.length, data, exportedAt: new Date().toISOString() });
  } catch (err) {
    console.error('[GET admin/export]', err);
    return apiError('Failed to export data', 500);
  }
});
