import dbConnect from '@/lib/db';
import SearchHistory from '@/models/SearchHistory';
import { generateSearchSuggestions } from '@/lib/gemini';
import { apiSuccess, apiError } from '@/lib/apiHelpers';

export const GET = async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    await dbConnect();

    // If query is empty, return popular recent queries
    if (!query || query.trim().length === 0) {
      const popular = await SearchHistory.aggregate([
        { $match: { type: 'keyword', resultsCount: { $gt: 0 } } },
        { $group: { _id: '$query', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 }
      ]);
      return apiSuccess(popular.map(p => p._id));
    }

    // Attempt Gemini AI suggestions first
    if (process.env.GEMINI_API_KEY) {
      try {
        const suggestions = await generateSearchSuggestions(query);
        if (suggestions && suggestions.length > 0) {
          return apiSuccess(suggestions);
        }
      } catch (err) {
        console.warn('[Search Suggestions] Gemini failed, falling back to DB:', err.message);
      }
    }

    // Fallback to recent history regex match
    const historySuggestions = await SearchHistory.aggregate([
      { $match: { query: { $regex: `^${query.toLowerCase()}`, $options: 'i' }, resultsCount: { $gt: 0 } } },
      { $group: { _id: '$query' } },
      { $limit: 5 }
    ]);
    
    return apiSuccess(historySuggestions.map(p => p._id));
  } catch (err) {
    console.error('[GET search suggestions]', err);
    return apiError('Failed to fetch suggestions', 500);
  }
};
