import dbConnect from '@/lib/db';
import AdminLog from '@/models/AdminLog';
import { withAdmin, apiSuccess, apiError } from '@/lib/apiHelpers';

export const GET = withAdmin(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;
    const action = searchParams.get('action') || ''; // filter by action type

    await dbConnect();

    const query = {};
    if (action) query.action = action;

    const logs = await AdminLog.paginate(query, {
      page, limit,
      sort: { createdAt: -1 },
      populate: [{ path: 'adminId', select: 'username displayName' }]
    });

    return apiSuccess({
      docs: logs.docs,
      totalDocs: logs.totalDocs,
      page: logs.page,
      totalPages: logs.totalPages,
      hasNextPage: logs.hasNextPage
    });
  } catch (err) {
    console.error('[GET admin/logs]', err);
    return apiError('Failed to fetch admin logs', 500);
  }
});
