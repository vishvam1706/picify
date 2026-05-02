import dbConnect from '@/lib/db';
import User from '@/models/User';
import Pin from '@/models/Pin';
import Board from '@/models/Board';
import Comment from '@/models/Comment';
import Report from '@/models/Report';
import { withAdmin, apiSuccess, apiError } from '@/lib/apiHelpers';

// GET /api/admin/platform-analytics — comprehensive platform-wide analytics
export const GET = withAdmin(async () => {
  try {
    await dbConnect();

    const now = new Date();
    const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(now.getDate() - 30);
    const sevenDaysAgo = new Date(now); sevenDaysAgo.setDate(now.getDate() - 7);

    // Parallel aggregate queries
    const [
      totalUsers, totalPins, totalBoards, totalComments,
      newUsersLast7d, newPinsLast7d,
      pendingReports, resolvedReports,
      topCreators,
    ] = await Promise.all([
      User.countDocuments({ isDeleted: false }),
      Pin.countDocuments({ isDeleted: false }),
      Board.countDocuments({ isDeleted: false }),
      Comment.countDocuments({ isDeleted: false }),
      User.countDocuments({ isDeleted: false, createdAt: { $gte: sevenDaysAgo } }),
      Pin.countDocuments({ isDeleted: false, createdAt: { $gte: sevenDaysAgo } }),
      Report.countDocuments({ status: 'pending' }),
      Report.countDocuments({ status: 'resolved' }),
      // Top creators by pin count
      Pin.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$userId', pinCount: { $sum: 1 }, totalLikes: { $sum: '$likesCount' }, totalSaves: { $sum: '$savesCount' } } },
        { $sort: { pinCount: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        { $project: { pinCount: 1, totalLikes: 1, totalSaves: 1, 'user.username': 1, 'user.displayName': 1, 'user.profileImage': 1 } },
      ]),
    ]);

    // Signup trend: last 30 days daily
    const signupTrend = await User.aggregate([
      { $match: { isDeleted: false, createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        }
      },
      { $sort: { _id: 1 } },
    ]);

    // Pin creation trend
    const pinTrend = await Pin.aggregate([
      { $match: { isDeleted: false, createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        }
      },
      { $sort: { _id: 1 } },
    ]);

    return apiSuccess({
      overview: { totalUsers, totalPins, totalBoards, totalComments, pendingReports, resolvedReports },
      growth: { newUsersLast7d, newPinsLast7d },
      signupTrend: signupTrend.map(d => ({ date: d._id, count: d.count })),
      pinTrend: pinTrend.map(d => ({ date: d._id, count: d.count })),
      topCreators: topCreators.map(c => ({
        _id: c._id,
        username: c.user.username,
        displayName: c.user.displayName,
        profileImage: c.user.profileImage,
        pinCount: c.pinCount,
        totalLikes: c.totalLikes,
        totalSaves: c.totalSaves,
      })),
    });
  } catch (err) {
    console.error('[GET /api/admin/platform-analytics]', err);
    return apiError('Failed to fetch platform analytics', 500);
  }
});
