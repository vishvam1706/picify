import dbConnect from '@/lib/db';
import SystemSettings from '@/models/SystemSettings';
import AdminLog from '@/models/AdminLog';
import { withAdmin, withOptionalAuth, apiSuccess, apiError } from '@/lib/apiHelpers';

async function getSettings() {
  let settings = await SystemSettings.findOne().lean();
  if (!settings) {
    // Create defaults on first access
    settings = await SystemSettings.create({});
  }
  return settings;
}

// GET /api/admin/system-settings — returns all system settings
export const GET = withAdmin(async () => {
  try {
    await dbConnect();
    const settings = await getSettings();
    return apiSuccess(settings);
  } catch (err) {
    console.error('[GET /api/admin/system-settings]', err);
    return apiError('Failed to fetch settings', 500);
  }
});

// PATCH /api/admin/system-settings — update any setting
export const PATCH = withAdmin(async (request) => {
  try {
    await dbConnect();
    const updates = await request.json();

    // Allowed top-level paths (prevent arbitrary injection)
    const allowed = ['trending', 'aiModeration', 'upload', 'platform'];
    const sanitized = {};
    for (const key of allowed) {
      if (updates[key] !== undefined) sanitized[key] = updates[key];
    }
    sanitized.updatedAt = new Date();
    sanitized.updatedBy = request.user._id;

    const settings = await SystemSettings.findOneAndUpdate(
      {},
      { $set: sanitized },
      { upsert: true, new: true }
    );

    await AdminLog.create({
      adminId: request.user._id,
      action: 'settings_updated',
      entityType: 'system',
      details: { changes: Object.keys(sanitized).filter(k => k !== 'updatedAt' && k !== 'updatedBy') },
    });

    return apiSuccess(settings);
  } catch (err) {
    console.error('[PATCH /api/admin/system-settings]', err);
    return apiError('Failed to update settings', 500);
  }
});
