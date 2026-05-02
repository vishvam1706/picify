import dbConnect from '@/lib/db';
import User from '@/models/User';
import Pin from '@/models/Pin';
import { withAuth, apiSuccess, apiError } from '@/lib/apiHelpers';

// GET /api/analytics/audience — follower insights for current user
export const GET = withAuth(async (request) => {
  try {
    await dbConnect();
    const user = await User.findById(request.user._id)
      .populate('followers', 'username displayName profileImage createdAt followersCount')
      .lean();

    const followers = user.followers || [];

    // Follower growth buckets (last 30 days — we use join date as proxy)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const growthBuckets = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      growthBuckets[key] = { date: key, newFollowers: 0 };
    }

    let recentFollowers = 0;
    for (const f of followers) {
      const key = new Date(f.createdAt).toISOString().split('T')[0];
      if (growthBuckets[key]) {
        growthBuckets[key].newFollowers += 1;
        recentFollowers++;
      }
    }

    // Top follower influencers (those with most followers themselves)
    const topFollowers = [...followers]
      .sort((a, b) => (b.followersCount || 0) - (a.followersCount || 0))
      .slice(0, 5)
      .map(f => ({
        _id: f._id,
        username: f.username,
        displayName: f.displayName,
        profileImage: f.profileImage,
        followersCount: f.followersCount || 0,
      }));

    // Pin counts and total engagement
    const pinStats = await Pin.aggregate([
      { $match: { userId: request.user._id, isDeleted: false } },
      {
        $group: {
          _id: null,
          totalPins: { $sum: 1 },
          avgLikes: { $avg: '$likesCount' },
          avgSaves: { $avg: '$savesCount' },
          avgViews: { $avg: '$views' },
        }
      }
    ]);

    const ps = pinStats[0] || {};

    return apiSuccess({
      followerGrowth: Object.values(growthBuckets),
      totalFollowers: user.followersCount || followers.length,
      totalFollowing: user.followingCount || 0,
      recentFollowers,
      topFollowers,
      averageEngagement: {
        likesPerPin: Math.round(ps.avgLikes || 0),
        savesPerPin: Math.round(ps.avgSaves || 0),
        viewsPerPin: Math.round(ps.avgViews || 0),
      },
    });
  } catch (err) {
    console.error('[GET /api/analytics/audience]', err);
    return apiError('Failed to fetch audience data', 500);
  }
});
