import dbConnect from '@/lib/db';
import Pin from '@/models/Pin';
import User from '@/models/User';
import SearchHistory from '@/models/SearchHistory';
import { withOptionalAuth, apiSuccess, apiError } from '@/lib/apiHelpers';
import { getBlockedUserIds } from '@/lib/blockFilter';

export const GET = withOptionalAuth(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'pins'; // 'pins' or 'users'
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const filterOrientation = searchParams.get('orientation'); // landscape, portrait, square
    const filterColor = searchParams.get('color'); // approximate hex matching

    await dbConnect();

    // Fetch blocked user IDs once for all filter operations below
    const blockedIds = await getBlockedUserIds(request.user?._id);

    // ── User Search ──────────────────────────────────────────────────────
    if (type === 'users') {
      if (!query) {
        return apiSuccess({ docs: [], totalDocs: 0, page, totalPages: 0, hasNextPage: false });
      }

      const userDbQuery = {
        isDeleted: false,
        isActive: true,
        'privacy.isPublic': true,
        ...(blockedIds.length > 0 && { _id: { $nin: blockedIds } }),
        $or: [
          { username: { $regex: query, $options: 'i' } },
          { displayName: { $regex: query, $options: 'i' } },
          { bio: { $regex: query, $options: 'i' } }
        ]
      };

      const users = await User.paginate(userDbQuery, {
        page,
        limit,
        select: 'username displayName profileImage bio followersCount isVerified',
        sort: { followersCount: -1 } // Rank hits by popularity
      });

      return apiSuccess({
        docs: users.docs,
        totalDocs: users.totalDocs,
        page: users.page,
        totalPages: users.totalPages,
        hasNextPage: users.hasNextPage,
      });
    }

    // ── Pin Search ───────────────────────────────────────────────────────
    let pinQuery = {
      isPublic: true,
      isDeleted: false,
      isDraft: false,
      ...(blockedIds.length > 0 && { userId: { $nin: blockedIds } }),
    };

    if (filterOrientation) {
      pinQuery.orientation = filterOrientation;
    }

    if (query) {
      pinQuery.$or = [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { tags: { $regex: query, $options: 'i' } },
        { categories: { $regex: query, $options: 'i' } }
      ];
    }

    const sortOptions = { savesCount: -1, createdAt: -1 };

    const pins = await Pin.paginate(pinQuery, {
      page,
      limit,
      sort: sortOptions,
      populate: { path: 'userId', select: 'username displayName profileImage' },
      lean: true
    });

    // Sub-filter by approximate color if provided
    let results = pins.docs;
    if (filterColor && results.length > 0) {
      // Very basic substring match or color proximity logic can be expanded here
      // For now, exactly matching the dominant hex substring
      results = results.filter(p => 
        p.colorPalette?.some(hex => hex.toLowerCase().includes(filterColor.toLowerCase()))
      );
    }

    // Save Search History (async, don't await blocking the response)
    if (query && page === 1) {
      SearchHistory.create({
        userId: request.user ? request.user._id : null,
        query: query.trim().toLowerCase(),
        type: 'keyword',
        filters: { orientation: filterOrientation, color: filterColor },
        resultsCount: pins.totalDocs
      }).catch(console.error);
    }

    if (request.user) {
      const SavedPin = (await import('@/models/SavedPin')).default;
      const savedPinIds = await SavedPin.find({ userId: request.user._id, pinId: { $in: results.map(r => r._id) } }).distinct('pinId');
      const savedSet = new Set(savedPinIds.map(id => id.toString()));
      const userIdStr = request.user._id.toString();

      results = results.map(p => {
        const isSaved = savedSet.has(p._id.toString());
        const isLiked = p.likes && p.likes.some(id => id.toString() === userIdStr);
        const obj = { ...p, isSaved, isLiked };
        delete obj.likes;
        delete obj.saves;
        return obj;
      });
    } else {
      results = results.map(p => {
        const obj = { ...p };
        delete obj.likes;
        delete obj.saves;
        return obj;
      });
    }

    return apiSuccess({
      docs: results,
      totalDocs: pins.totalDocs,
      page: pins.page,
      totalPages: pins.totalPages,
      hasNextPage: pins.hasNextPage,
    });
  } catch (err) {
    console.error('[GET search]', err);
    return apiError('Search failed', 500);
  }
});
