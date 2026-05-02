import dbConnect from '@/lib/db';
import Pin from '@/models/Pin';
import { withAuth, apiError } from '@/lib/apiHelpers';

export const GET = withAuth(async (request) => {
  try {
    await dbConnect();

    // Verify feature flag
    const FeatureFlag = (await import('@/models/FeatureFlag')).default;
    const flag = await FeatureFlag.findOne({ key: 'analytics_export' });
    
    if (!flag || !flag.enabled) {
      return apiError('Analytics export is currently disabled', 403);
    }

    const pins = await Pin.find({ userId: request.user._id, isDeleted: false })
      .select('title viewsCount likesCount savesCount commentsCount clicksCount isSponsored publishedAt createdAt')
      .sort({ createdAt: -1 })
      .lean();

    // Generate CSV
    const headers = ['Pin ID', 'Title', 'Date Published', 'Views', 'Likes', 'Saves', 'Comments', 'Clicks', 'Sponsored'];
    const rows = pins.map(p => [
      p._id.toString(),
      `"${(p.title || 'Untitled').replace(/"/g, '""')}"`,
      p.publishedAt ? new Date(p.publishedAt).toISOString() : new Date(p.createdAt).toISOString(),
      p.viewsCount || 0,
      p.likesCount || 0,
      p.savesCount || 0,
      p.commentsCount || 0,
      p.clicksCount || 0,
      p.isSponsored ? 'Yes' : 'No'
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="analytics_export_${Date.now()}.csv"`
      }
    });

  } catch (err) {
    console.error('[GET /api/users/analytics/export]', err);
    return apiError('Failed to export analytics', 500);
  }
});
