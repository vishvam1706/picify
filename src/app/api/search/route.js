import dbConnect from '@/lib/db';
import Pin from '@/models/Pin';
import User from '@/models/User';
import SearchHistory from '@/models/SearchHistory';
import { withOptionalAuth, apiSuccess, apiError } from '@/lib/apiHelpers';

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

    // ── User Search ──────────────────────────────────────────────────────
    if (type === 'users') {
      if (!query) {
        return apiSuccess({ docs: [], totalDocs: 0, page, totalPages: 0, hasNextPage: false });
      }

      const userDbQuery = {
        isDeleted: false,
        isActive: true,
        'privacy.isPublic': true,
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
      isDraft: false
    };

    if (filterOrientation) {
      pinQuery.orientation = filterOrientation;
    }

    if (query) {
      // Use MongoDB Atlas Search (or text index fallback if strictly self-hosted)
      // We rely on the traditional $text for general text matches
      pinQuery.$text = { $search: query };
    }

    const sortOptions = query ? { score: { $meta: 'textScore' } } : { savesCount: -1, createdAt: -1 };

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
