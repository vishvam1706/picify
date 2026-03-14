import dbConnect from '@/lib/db';
import Report from '@/models/Report';
import AdminLog from '@/models/AdminLog';
import { withAdmin, apiSuccess, apiError } from '@/lib/apiHelpers';

export const PATCH = withAdmin(async (request, { params }) => {
  try {
    const { id } = await params;
    const { status, adminNotes } = await request.json();

    if (!['resolved', 'dismissed'].includes(status)) {
      return apiError('Status must be "resolved" or "dismissed"', 400);
    }

    await dbConnect();

    const report = await Report.findById(id).populate('reporterId', 'username displayName');
    if (!report) return apiError('Report not found', 404);

    report.status = status;
    report.adminNotes = adminNotes || '';
    report.resolvedBy = request.user._id;
    report.resolvedAt = new Date();
    await report.save();

    await AdminLog.create({
      adminId: request.user._id,
      action: 'RESOLVE_REPORT',
      targetId: report._id,
      targetModel: 'Report',
      details: { status, adminNotes }
    });

    return apiSuccess(report);
  } catch (err) {
    console.error('[PATCH admin/reports/[id]]', err);
    return apiError('Failed to update report', 500);
  }
});
