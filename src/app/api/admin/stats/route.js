import dbConnect from '@/lib/db';
import User from '@/models/User';
import Pin from '@/models/Pin';
import Board from '@/models/Board';
import Report from '@/models/Report';
import { withAdmin, apiSuccess, apiError } from '@/lib/apiHelpers';

export const GET = withAdmin(async () => {
  try {
    await dbConnect();

    const [
      totalUsers,
      activeUsers,
      totalPins,
      totalBoards,
      pendingReports,
      nsfwPins
    ] = await Promise.all([
      User.countDocuments({ isDeleted: false }),
      User.countDocuments({ isDeleted: false, isActive: true }),
      Pin.countDocuments({ isDeleted: false }),
      Board.countDocuments({ isDeleted: false }),
      Report.countDocuments({ status: 'pending' }),
      Pin.countDocuments({ isNSFW: true, isDeleted: false })
    ]);

    // For a real dashboard, we might aggregate signups over the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSignups = await User.countDocuments({
      isDeleted: false,
      createdAt: { $gte: thirtyDaysAgo }
    });

    return apiSuccess({
      users: { total: totalUsers, active: activeUsers, recent30d: recentSignups },
      content: { pins: totalPins, boards: totalBoards, nsfwPins },
      moderation: { pendingReports }
    });
  } catch (err) {
    console.error('[GET admin stats]', err);
    return apiError('Failed to fetch stats', 500);
  }
});
