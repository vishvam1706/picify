import dbConnect from '@/lib/db';
import SearchHistory from '@/models/SearchHistory';
import { apiSuccess, apiError } from '@/lib/apiHelpers';

export const GET = async () => {
  try {
    await dbConnect();

    // Get the most popular successful searches in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trending = await SearchHistory.aggregate([
      { 
        $match: { 
          type: 'keyword', 
          resultsCount: { $gt: 0 },
          searchedAt: { $gte: sevenDaysAgo }
        } 
      },
      { 
        $group: { 
          _id: '$query', 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    return apiSuccess(trending.map(t => t._id));
  } catch (err) {
    console.error('[GET trending queries]', err);
    return apiError('Failed to fetch trending queries', 500);
  }
};
