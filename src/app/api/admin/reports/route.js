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
        { path: 'reporterId', select: 'username displayName profileImage' },
        { path: 'reviewedBy', select: 'username displayName' }
      ]
    });

    const User = (await import('@/models/User')).default;
    const Pin = (await import('@/models/Pin')).default;

    const populatedDocs = await Promise.all(reports.docs.map(async (doc) => {
      let entity = null;
      if (doc.entityType === 'user') {
        entity = await User.findById(doc.entityId, 'username displayName profileImage').lean();
      } else if (doc.entityType === 'pin') {
        entity = await Pin.findById(doc.entityId, 'title images').lean();
      }
      return { ...doc.toObject(), entity };
    }));

    return apiSuccess({
      docs: populatedDocs,
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
    report.reviewNotes = notes;   // schema field is 'reviewNotes'
    report.reviewedBy = request.user._id;  // schema field is 'reviewedBy'

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
