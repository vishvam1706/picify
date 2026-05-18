import dbConnect from '@/lib/db';
import Announcement from '@/models/Announcement';
import { withOptionalAuth, apiSuccess, apiError } from '@/lib/apiHelpers';

// GET /api/announcements — public active announcements for the frontend banner
export const GET = withOptionalAuth(async (request) => {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || 'all';

    const now = new Date();
    const query = {
      isActive: true,
      $and: [
        { $or: [{ expiresAt: { $gt: now } }, { expiresAt: null }] },
        { $or: [{ targetRole: 'all' }, { targetRole: role }] },
      ],
    };

    const announcements = await Announcement.find(query)
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(5)
      .select('title body type isPinned targetRole createdAt')
      .lean();

    return apiSuccess(announcements);
  } catch (err) {
    console.error('[GET /api/announcements]', err);
    return apiError('Failed to fetch announcements', 500);
  }
});
