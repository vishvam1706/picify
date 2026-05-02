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

    // Always upsert — avoid comparison bugs with undefined/false
    const settings = await SystemSettings.findOneAndUpdate(
      {},
      {
        $set: {
          ...(updates.maintenanceMode !== undefined && { 'platform.maintenanceMode': updates.maintenanceMode }),
          ...(updates.allowRegistrations !== undefined && { 'platform.registrationOpen': updates.allowRegistrations }),
          ...(updates.maxUploadSizeMB !== undefined && { 'upload.maxFileSize': updates.maxUploadSizeMB }),
          ...(updates.weightViews !== undefined && { 'trending.weightViews': updates.weightViews }),
          ...(updates.weightLikes !== undefined && { 'trending.weightLikes': updates.weightLikes }),
          ...(updates.weightSaves !== undefined && { 'trending.weightSaves': updates.weightSaves }),
          updatedAt: new Date(),
          updatedBy: request.user._id,
        }
      },
      { new: true, upsert: true, runValidators: true }
    );

    await AdminLog.create({
      adminId: request.user._id,
      action: 'UPDATE_SYSTEM_SETTINGS',
      details: updates
    });

    return apiSuccess(settings);
  } catch (err) {
    console.error('[PATCH admin/system]', err);
    return apiError('Failed to update system settings', 500);
  }
});

