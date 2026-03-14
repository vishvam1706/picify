import dbConnect from '@/lib/db';
import Report from '@/models/Report';
import { withAdmin, apiSuccess, apiError } from '@/lib/apiHelpers';

export const GET = withAdmin(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const status = searchParams.get('status') || 'pending'; // pending, resolved, dismissed

    await dbConnect();

    const query = { status };

    const reports = await Report.paginate(query, {
      page,
      limit,
      sort: { createdAt: -1 },
      populate: [
        { path: 'reporterId', select: 'username displayName' },
        { path: 'resolvedBy', select: 'username displayName' }
      ]
    });

    return apiSuccess({
      docs: reports.docs,
      totalDocs: reports.totalDocs,
      page: reports.page,
      totalPages: reports.totalPages,
      hasNextPage: reports.hasNextPage,
    });
  } catch (err) {
    console.error('[GET admin reports]', err);
    return apiError('Failed to fetch reports', 500);
  }
});

// Create resolving logic
export const PATCH = withAdmin(async (request) => {
  try {
    const { id, status, notes } = await request.json();

    if (!['resolved', 'dismissed'].includes(status)) {
      return apiError('Invalid status', 400); 
    }

    await dbConnect();
    
    const report = await Report.findById(id);
    if (!report) return apiError('Report not found', 404);

    report.status = status;
    report.adminNotes = notes;
    report.resolvedBy = request.user._id;

    await report.save();

    // Side effects (deleting pin, banning user) would typically 
    // be done in separate specific Admin API calls, but could be integrated here.

    const AdminLog = (await import('@/models/AdminLog')).default;
    await AdminLog.create({
      adminId: request.user._id,
      action: 'RESOLVE_REPORT',
      targetId: report._id,
      targetModel: 'Report',
      details: { status, notes }
    });

    return apiSuccess(report);
  } catch (err) {
    console.error('[PATCH admin report]', err);
    return apiError('Failed to resolve report', 500);
  }
});
