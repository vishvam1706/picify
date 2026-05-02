import dbConnect from '@/lib/db';
import FeatureFlag from '@/models/FeatureFlag';
import AdminLog from '@/models/AdminLog';
import { withAdmin, apiSuccess, apiError } from '@/lib/apiHelpers';

// Default feature flags to seed if none exist
const DEFAULT_FLAGS = [
  { key: 'ai_captions', label: 'AI Captions', description: 'Auto-generate pin captions with Gemini AI', enabled: true },
  { key: 'ai_hashtags', label: 'AI Hashtags', description: 'Auto-generate hashtags for pins', enabled: true },
  { key: 'ai_toxic_filter', label: 'AI Toxic Comment Filter', description: 'Filter toxic comments with AI', enabled: false },
  { key: 'nsfw_detection', label: 'NSFW Detection', description: 'Auto-detect and flag explicit content', enabled: true },
  { key: 'monetization', label: 'Monetization / Tips', description: 'Enable creator tips and earnings', enabled: false },
  { key: 'creator_subscriptions', label: 'Creator Subscriptions', description: 'Enable paid creator subscriptions', enabled: false },
  { key: 'affiliate_pins', label: 'Affiliate Pins', description: 'Enable affiliate link tracking on pins', enabled: false },
  { key: 'sponsored_pins', label: 'Sponsored Pins', description: 'Enable paid promotion for pins', enabled: false },
  { key: 'private_vault', label: 'Private Vault Boards', description: 'Enable encrypted private boards', enabled: true },
  { key: 'parental_controls', label: 'Parental Controls', description: 'Enable safe-mode content filtering', enabled: false },
  { key: 'identity_verification', label: 'Identity Verification', description: 'Enable ID verification for creators', enabled: false },
  { key: 'scheduled_pins', label: 'Scheduled Pins', description: 'Allow creators to schedule pin publishing', enabled: true },
  { key: 'brand_collaborations', label: 'Brand Collaborations', description: 'Enable brand deal request system', enabled: false },
  { key: 'analytics_export', label: 'Analytics Export', description: 'Let creators export their analytics data', enabled: false },
];

// GET /api/admin/feature-flags
export const GET = withAdmin(async () => {
  try {
    await dbConnect();

    // Seed defaults if empty
    const count = await FeatureFlag.countDocuments();
    if (count === 0) {
      await FeatureFlag.insertMany(DEFAULT_FLAGS);
    }

    const flags = await FeatureFlag.find().sort({ key: 1 }).lean();
    return apiSuccess(flags);
  } catch (err) {
    console.error('[GET /api/admin/feature-flags]', err);
    return apiError('Failed to fetch feature flags', 500);
  }
});

// PATCH /api/admin/feature-flags — toggle a flag
export const PATCH = withAdmin(async (request) => {
  try {
    await dbConnect();
    const { key, enabled, rolloutPercent } = await request.json();
    if (!key) return apiError('key is required', 400);

    const updates = { updatedBy: request.user._id };
    if (enabled !== undefined) updates.enabled = enabled;
    if (rolloutPercent !== undefined) updates.rolloutPercent = rolloutPercent;

    const flag = await FeatureFlag.findOneAndUpdate({ key }, updates, { new: true, upsert: true });

    await AdminLog.create({
      adminId: request.user._id,
      action: 'settings_updated',
      entityType: 'system',
      details: { action: 'TOGGLE_FEATURE_FLAG', key, enabled },
    });

    return apiSuccess(flag);
  } catch (err) {
    console.error('[PATCH /api/admin/feature-flags]', err);
    return apiError('Failed to update feature flag', 500);
  }
});
