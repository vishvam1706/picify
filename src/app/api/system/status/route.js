import dbConnect from '@/lib/db';
import SystemSettings from '@/models/SystemSettings';
import { apiSuccess, apiError } from '@/lib/apiHelpers';

export const dynamic = 'force-dynamic';

const FEATURE_KEYS = [
  'monetization', 'creator_subscriptions', 'affiliate_pins',
  'sponsored_pins', 'brand_collaborations', 'analytics_export'
];

export async function GET() {
  try {
    await dbConnect();
    const settings = await SystemSettings.findOne().lean();
    
    const FeatureFlag = (await import('@/models/FeatureFlag')).default;
    const flags = await FeatureFlag.find({ key: { $in: FEATURE_KEYS } }).lean();
    
    const features = {};
    for (const f of flags) features[f.key] = f.enabled;
    // Default anything not yet seeded to false
    for (const k of FEATURE_KEYS) if (features[k] === undefined) features[k] = false;
    
    return apiSuccess({
      maintenanceMode: settings?.platform?.maintenanceMode || false,
      features,
    });
  } catch (err) {
    console.error('[GET /api/system/status]', err);
    return apiError('Failed to fetch system status', 500);
  }
}
