import dbConnect from '@/lib/db';
import SystemSettings from '@/models/SystemSettings';
import { apiSuccess, apiError } from '@/lib/apiHelpers';

// GET /api/settings/public — public safe settings for frontend
export async function GET() {
  try {
    await dbConnect();
    const settings = await SystemSettings.findOne().lean();
    return apiSuccess({
      registrationOpen: settings?.platform?.registrationOpen ?? true,
      maintenanceMode: settings?.platform?.maintenanceMode ?? false,
    });
  } catch (err) {
    console.error('[GET /api/settings/public]', err);
    // fail-open: if DB fails, don't block users from registering
    return apiSuccess({ registrationOpen: true, maintenanceMode: false });
  }
}
