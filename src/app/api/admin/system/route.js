import dbConnect from '@/lib/db';
import SystemSettings from '@/models/SystemSettings';
import AdminLog from '@/models/AdminLog';
import { withAdmin, apiSuccess, apiError } from '@/lib/apiHelpers';

export const GET = withAdmin(async () => {
  try {
    await dbConnect();
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = await SystemSettings.create({});
    }
    return apiSuccess(settings);
  } catch (err) {
    console.error('[GET admin/system]', err);
    return apiError('Failed to fetch system settings', 500);
  }
});

export const PATCH = withAdmin(async (request) => {
  try {
    const updates = await request.json();
    await dbConnect();

    // Prevent random fields
    const validKeys = [
      'maintenanceMode', 'allowRegistrations', 'requireEmailVerification',
      'maxUploadSizeMB', 'maxPinsPerDay', 'autoBanThreshold'
    ];
    
    let sanitized = {};
    for (const key of Object.keys(updates)) {
      if (validKeys.includes(key)) {
        sanitized[key] = updates[key];
      }
    }

    let settings = await SystemSettings.findOne();
    if (!settings) settings = new SystemSettings();

    // Track what changed for logs
    const changes = {};
    for (const key of Object.keys(sanitized)) {
      if (settings[key] !== sanitized[key]) {
        changes[key] = { from: settings[key], to: sanitized[key] };
        settings[key] = sanitized[key];
      }
    }

    await settings.save();

    if (Object.keys(changes).length > 0) {
      await AdminLog.create({
        adminId: request.user._id,
        action: 'UPDATE_SYSTEM_SETTINGS',
        details: changes
      });
    }

    return apiSuccess(settings);
  } catch (err) {
    console.error('[PATCH admin/system]', err);
    return apiError('Failed to update system settings', 500);
  }
});
