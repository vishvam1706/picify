import dbConnect from '@/lib/db';
import Pin from '@/models/Pin';
import { withOptionalAuth, apiSuccess, apiError } from '@/lib/apiHelpers';

export const GET = withOptionalAuth(async (request, { params }) => {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 20;

    await dbConnect();
    const { id: pinId } = await params;

    const sourcePin = await Pin.findOne({ _id: pinId, isDeleted: false });
    if (!sourcePin) return apiError('Pin not found', 404);

    // AI/Algorithm approach: 
    // 1. Same tags/categories
    // 2. Same board
    // 3. Fallback to newest
    
    // Build an $or query based on sourcePin metadata
    const orConditions = [];
    
    if (sourcePin.categories && sourcePin.categories.length > 0) {
      orConditions.push({ categories: { $in: sourcePin.categories } });
    }
    if (sourcePin.tags && sourcePin.tags.length > 0) {
      orConditions.push({ tags: { $in: sourcePin.tags } });
    }
    if (sourcePin.boardId) {
      orConditions.push({ boardId: sourcePin.boardId });
    }

    let query = {
      _id: { $ne: sourcePin._id },
      isPublic: true,
      isDeleted: false,
      isDraft: false,
      publishedAt: { $lte: new Date() }
    };

    if (orConditions.length > 0) {
      query.$or = orConditions;
    }

    // Advanced search: if no exact tag overlap, fetch random pins as fallback
    let relatedPins = await Pin.find(query)
      .limit(limit)
      .sort({ savesCount: -1, likesCount: -1, publishedAt: -1 })
      .populate('userId', 'username displayName profileImage')
      .lean();

    // Fallback if not enough results
    if (relatedPins.length < limit / 2) {
      const fallbackQuery = {
        _id: { $ne: sourcePin._id },
        isPublic: true,
        isDeleted: false,
        isDraft: false,
      };
      const fallbackPins = await Pin.find(fallbackQuery)
        .limit(limit - relatedPins.length)
        .sort({ views: -1 })
        .populate('userId', 'username displayName profileImage')
        .lean();
        
      relatedPins = [...relatedPins, ...fallbackPins];
    }

    return apiSuccess({ docs: relatedPins });
  } catch (err) {
    console.error('[GET related pins]', err);
    return apiError('Failed to fetch related pins', 500);
  }
});
