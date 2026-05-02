import dbConnect from '@/lib/db';
import CategoryTag from '@/models/CategoryTag';
import { apiSuccess, apiError } from '@/lib/apiHelpers';

export const dynamic = 'force-dynamic';

// GET /api/categories — public endpoint, no auth required
export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'category';

    const categories = await CategoryTag.find({ type, isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .select('name slug emoji color type')
      .lean();

    return apiSuccess(categories);
  } catch (err) {
    console.error('[GET /api/categories]', err);
    return apiError('Failed to fetch categories', 500);
  }
}
