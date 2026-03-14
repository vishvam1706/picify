import dbConnect from '@/lib/db';
import User from '@/models/User';
import AdminLog from '@/models/AdminLog';
import { withAdmin, apiSuccess, apiError } from '@/lib/apiHelpers';

export const GET = withAdmin(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all'; // active, suspended, deleted

    await dbConnect();

    const query = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (status === 'suspended') {
      query.isActive = false;
      query.isDeleted = false;
    } else if (status === 'deleted') {
      query.isDeleted = true;
    } else if (status === 'active') {
      query.isActive = true;
      query.isDeleted = false;
    }

    const users = await User.paginate(query, {
      page,
      limit,
      sort: { createdAt: -1 },
      select: '-password -twoFactorSecret'
    });

    return apiSuccess({
      docs: users.docs,
      totalDocs: users.totalDocs,
      page: users.page,
      totalPages: users.totalPages,
      hasNextPage: users.hasNextPage,
    });
  } catch (err) {
    console.error('[GET admin users]', err);
    return apiError('Failed to fetch users', 500);
  }
});
