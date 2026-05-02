import dbConnect from '@/lib/db';
import Pin from '@/models/Pin';
import { withAuth, apiSuccess, apiError } from '@/lib/apiHelpers';

// GET /api/analytics/engagement — 30-day time-series for current user's pins
export const GET = withAuth(async (request) => {
  try {
    await dbConnect();
    const userId = request.user._id;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all user's pins
    const pins = await Pin.find({ userId, isDeleted: false })
      .select('title likesCount savesCount commentsCount views createdAt publishedAt')
      .lean();

    // Build daily buckets for the last 30 days
    const buckets = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      buckets[key] = { date: key, views: 0, likes: 0, saves: 0, comments: 0, newPins: 0 };
    }

    // Distribute pin stats across their publish date (simplified model)
    for (const pin of pins) {
      const pinDate = (pin.publishedAt || pin.createdAt);
      const key = new Date(pinDate).toISOString().split('T')[0];
      if (buckets[key]) {
        buckets[key].newPins += 1;
        // Estimate daily engagement as fraction of total (simplified)
        buckets[key].likes += Math.round((pin.likesCount || 0) * 0.1);
        buckets[key].saves += Math.round((pin.savesCount || 0) * 0.1);
        buckets[key].views += Math.round((pin.views || 0) * 0.1);
        buckets[key].comments += Math.round((pin.commentsCount || 0) * 0.1);
      }
    }

    const series = Object.values(buckets);

    // Totals
    const totalViews = pins.reduce((s, p) => s + (p.views || 0), 0);
    const totalLikes = pins.reduce((s, p) => s + (p.likesCount || 0), 0);
    const totalSaves = pins.reduce((s, p) => s + (p.savesCount || 0), 0);
    const totalComments = pins.reduce((s, p) => s + (p.commentsCount || 0), 0);

    // Engagement rate: (likes + saves + comments) / views
    const engagementRate = totalViews > 0
      ? (((totalLikes + totalSaves + totalComments) / totalViews) * 100).toFixed(2)
      : '0.00';

    return apiSuccess({ series, totals: { views: totalViews, likes: totalLikes, saves: totalSaves, comments: totalComments, engagementRate } });
  } catch (err) {
    console.error('[GET /api/analytics/engagement]', err);
    return apiError('Failed to fetch engagement data', 500);
  }
});
