import dbConnect from '@/lib/db';
import Activity from '@/models/Activity';
import User from '@/models/User';
import { withAuth, apiSuccess, apiError } from '@/lib/apiHelpers';
import { getBlockedUserIds } from '@/lib/blockFilter';

// GET /api/activity — user's activity feed + following feed
export const GET = withAuth(async (request) => {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const filter = searchParams.get('filter') || 'all'; // 'mine' | 'following' | 'all'

    // Fetch fresh following list directly from DB (request.user may have it truncated)
    const freshUser = await User.findById(request.user._id).select('following').lean();
    const followingIds = freshUser?.following || [];

    // Exclude blocked users from activity feed
    const blockedIds = await getBlockedUserIds(request.user._id);
    const blockedSet = new Set(blockedIds);

    let query = {};
    if (filter === 'mine') {
      query.userId = request.user._id;
    } else if (filter === 'following') {
      const filteredFollowing = followingIds.filter(id => !blockedSet.has(id.toString()));
      query.userId = { $in: filteredFollowing };
    } else {
      // 'all' = own + following (excluding blocked)
      const filteredFollowing = followingIds.filter(id => !blockedSet.has(id.toString()));
      query.userId = { $in: [request.user._id, ...filteredFollowing] };
    }

    const activities = await Activity.paginate(query, {
      page,
      limit,
      sort: { createdAt: -1 },
      populate: [
        { path: 'userId', select: 'username displayName profileImage isVerified' },
      ],
      lean: true,
    });

    // Populate entityId for pin-related activities (like, save, comment, pin_created)
    const Pin = (await import('@/models/Pin')).default;
    const Board = (await import('@/models/Board')).default;

    const pinIds = [];
    const boardIds = [];
    activities.docs.forEach(a => {
      if (a.entityId) {
        if (a.entityType === 'pin') pinIds.push(a.entityId);
        if (a.entityType === 'board') boardIds.push(a.entityId);
      }
    });

    // Batch fetch entities
    const [pins, boards] = await Promise.all([
      pinIds.length
        ? Pin.find({ _id: { $in: pinIds }, isDeleted: false })
            .select('title images likesCount savesCount views')
            .lean()
        : [],
      boardIds.length
        ? Board.find({ _id: { $in: boardIds }, isDeleted: false })
            .select('name coverImage')
            .lean()
        : [],
    ]);

    const pinMap = Object.fromEntries(pins.map(p => [p._id.toString(), p]));
    const boardMap = Object.fromEntries(boards.map(b => [b._id.toString(), b]));

    // Attach entity data to each activity
    const enrichedDocs = activities.docs.map(a => {
      if (!a.entityId) return a;
      const id = a.entityId.toString();
      let entity = null;
      if (a.entityType === 'pin' && pinMap[id]) {
        const p = pinMap[id];
        entity = {
          _id: p._id,
          title: p.title,
          thumbnail: p.images?.[0]?.url || null,
          likesCount: p.likesCount,
          savesCount: p.savesCount,
          views: p.views,
        };
      } else if (a.entityType === 'board' && boardMap[id]) {
        const b = boardMap[id];
        entity = { _id: b._id, name: b.name, coverImage: b.coverImage };
      }
      return { ...a, entity };
    });

    return apiSuccess({
      docs: enrichedDocs,
      totalDocs: activities.totalDocs,
      page: activities.page,
      totalPages: activities.totalPages,
      hasNextPage: activities.hasNextPage,
    });
  } catch (err) {
    console.error('[GET activity]', err);
    return apiError('Failed to fetch activity', 500);
  }
});
