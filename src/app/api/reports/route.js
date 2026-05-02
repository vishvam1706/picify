import dbConnect from '@/lib/db';
import Report from '@/models/Report';
import { withAuth, apiSuccess, apiError } from '@/lib/apiHelpers';

// POST /api/reports — submit a report
export const POST = withAuth(async (request) => {
  try {
    await dbConnect();
    const { entityId, entityType, reason, description } = await request.json();

    if (!entityId || !entityType || !reason) {
      return apiError('entityId, entityType, and reason are required', 400);
    }

    const validTypes = ['pin', 'user', 'comment', 'board'];
    const validReasons = ['spam', 'inappropriate', 'copyright', 'harassment', 'other'];

    if (!validTypes.includes(entityType)) return apiError('Invalid entityType', 400);
    if (!validReasons.includes(reason)) return apiError('Invalid reason', 400);

    // Prevent duplicate pending reports from same user
    const existing = await Report.findOne({
      reporterId: request.user._id,
      entityId,
      entityType,
      status: 'pending',
    });
    if (existing) return apiError('You have already reported this content', 409);

    const report = await Report.create({
      reporterId: request.user._id,
      entityId,
      entityType,
      reason,
      description: description?.slice(0, 500),
    });

    return apiSuccess({ message: 'Report submitted. Our team will review it shortly.', reportId: report._id }, 201);
  } catch (err) {
    console.error('[POST /api/reports]', err);
    return apiError('Failed to submit report', 500);
  }
});

// GET /api/reports — get current user's submitted reports
export const GET = withAuth(async (request) => {
  try {
    await dbConnect();
    const reports = await Report.find({ reporterId: request.user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    return apiSuccess(reports);
  } catch (err) {
    console.error('[GET /api/reports]', err);
    return apiError('Failed to fetch reports', 500);
  }
});
