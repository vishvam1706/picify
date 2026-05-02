import dbConnect from '@/lib/db';
import CategoryTag from '@/models/CategoryTag';
import AdminLog from '@/models/AdminLog';
import { withAdmin, withOptionalAuth, apiSuccess, apiError } from '@/lib/apiHelpers';

// GET /api/admin/categories — list all (public too, for dropdowns)
export const GET = withOptionalAuth(async (request) => {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || '';
    const activeOnly = searchParams.get('active') !== 'false';

    const query = {};
    if (type) query.type = type;
    if (activeOnly) query.isActive = true;

    const categories = await CategoryTag.find(query)
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    return apiSuccess(categories);
  } catch (err) {
    console.error('[GET /api/admin/categories]', err);
    return apiError('Failed to fetch categories', 500);
  }
});

// POST /api/admin/categories — create
export const POST = withAdmin(async (request) => {
  try {
    await dbConnect();
    const body = await request.json();
    const { name, type = 'category', description, color, emoji, isFeatured, sortOrder } = body;

    if (!name) return apiError('Name is required', 400);

    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const existing = await CategoryTag.findOne({ slug });
    if (existing) return apiError('A category with this name already exists', 409);

    const cat = await CategoryTag.create({
      name, slug, type, description, color, emoji, isFeatured, sortOrder,
      createdBy: request.user._id,
    });

    await AdminLog.create({
      adminId: request.user._id,
      action: 'settings_updated',
      entityType: 'system',
      details: { action: 'CREATE_CATEGORY', name, type },
    });

    return apiSuccess(cat, 201);
  } catch (err) {
    console.error('[POST /api/admin/categories]', err);
    return apiError('Failed to create category', 500);
  }
});
