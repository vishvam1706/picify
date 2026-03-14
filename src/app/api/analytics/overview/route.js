import dbConnect from '@/lib/db';
import Analytics from '@/models/Analytics';
import { withAuth, apiSuccess, apiError } from '@/lib/apiHelpers';

export const GET = withAuth(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d'; // 7d, 30d, 90d

    await dbConnect();
    
    // We only serve analytics for "creators", so verify they have the flag
    if (!request.user.isCreator) {
      return apiError('Analytics are only available for creator accounts', 403);
    }

    const startDate = new Date();
    if (range === '7d') startDate.setDate(startDate.getDate() - 7);
    else if (range === '90d') startDate.setDate(startDate.getDate() - 90);
    else startDate.setDate(startDate.getDate() - 30);

    const matchQuery = {
      userId: request.user._id,
      date: { $gte: startDate }
    };

    // Aggregate totals for the top cards
    const totals = await Analytics.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$views' },
          totalLikes: { $sum: '$likes' },
          totalSaves: { $sum: '$saves' },
          totalComments: { $sum: '$comments' }
        }
      }
    ]);

    // Format timeseries for sparkline charts
    const timeseries = await Analytics.find(matchQuery)
      .sort({ date: 1 })
      .select('date views likes saves comments');

    return apiSuccess({
      totals: totals[0] || { totalViews: 0, totalLikes: 0, totalSaves: 0, totalComments: 0 },
      timeseries
    });
  } catch (err) {
    console.error('[GET analytics overview]', err);
    return apiError('Failed to fetch analytics', 500);
  }
});
