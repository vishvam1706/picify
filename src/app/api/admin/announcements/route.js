import dbConnect from '@/lib/db';
import Announcement from '@/models/Announcement';
import AdminLog from '@/models/AdminLog';
import { withAdmin, withOptionalAuth, apiSuccess, apiError } from '@/lib/apiHelpers';

// GET /api/admin/announcements
export const GET = withOptionalAuth(async (request) => {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') !== 'false';
    const isAdmin = request.user?.role === 'admin';

    const query = {};
    if (activeOnly && !isAdmin) {
      query.isActive = true;
      query.$or = [{ expiresAt: { $gt: new Date() } }, { expiresAt: null }];
    }

    const announcements = await Announcement.find(query)
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(20)
      .populate('createdBy', 'username displayName')
      .lean();

    return apiSuccess(announcements);
  } catch (err) {
    console.error('[GET /api/admin/announcements]', err);
    return apiError('Failed to fetch announcements', 500);
  }
});

// POST /api/admin/announcements — create
export const POST = withAdmin(async (request) => {
  try {
    await dbConnect();
    const { title, body, type, isPinned, targetRole, expiresAt } = await request.json();
    if (!title || !body) return apiError('Title and body are required', 400);

    const ann = await Announcement.create({
      title, body, type, isPinned, targetRole,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdBy: request.user._id,
    });

    await AdminLog.create({
      adminId: request.user._id,
      action: 'settings_updated',
      entityType: 'system',
      details: { action: 'CREATE_ANNOUNCEMENT', title },
    });

    return apiSuccess(ann, 201);
  } catch (err) {
    console.error('[POST /api/admin/announcements]', err);
    return apiError('Failed to create announcement', 500);
  }
});

// PATCH /api/admin/announcements — update by id in body
export const PATCH = withAdmin(async (request) => {
  try {
    await dbConnect();
    const { id, ...updates } = await request.json();
    if (!id) return apiError('id is required', 400);

    const allowed = ['title', 'body', 'type', 'isActive', 'isPinned', 'targetRole', 'expiresAt'];
    const sanitized = {};
    for (const k of allowed) if (updates[k] !== undefined) sanitized[k] = updates[k];

    const ann = await Announcement.findByIdAndUpdate(id, sanitized, { new: true });
    if (!ann) return apiError('Announcement not found', 404);

    return apiSuccess(ann);
  } catch (err) {
    console.error('[PATCH /api/admin/announcements]', err);
    return apiError('Failed to update announcement', 500);
  }
});

// DELETE /api/admin/announcements?id=xxx
export const DELETE = withAdmin(async (request) => {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return apiError('id is required', 400);

    await Announcement.findByIdAndDelete(id);
    return apiSuccess({ message: 'Announcement deleted' });
  } catch (err) {
    console.error('[DELETE /api/admin/announcements]', err);
    return apiError('Failed to delete announcement', 500);
  }
});
