import dbConnect from '@/lib/db';
import CategoryTag from '@/models/CategoryTag';
import AdminLog from '@/models/AdminLog';
import { withAdmin, apiSuccess, apiError } from '@/lib/apiHelpers';

// PATCH /api/admin/categories/[id]
export const PATCH = withAdmin(async (request, { params }) => {
  try {
    const { id } = await params;
    await dbConnect();
    const body = await request.json();
    const allowed = ['name', 'description', 'color', 'emoji', 'isActive', 'isFeatured', 'sortOrder', 'coverImage'];
    const updates = {};
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }
    const cat = await CategoryTag.findByIdAndUpdate(id, updates, { new: true });
    if (!cat) return apiError('Category not found', 404);

    await AdminLog.create({
      adminId: request.user._id,
      action: 'settings_updated',
      entityType: 'system',
      details: { action: 'UPDATE_CATEGORY', id, updates },
    });

    return apiSuccess(cat);
  } catch (err) {
    console.error('[PATCH /api/admin/categories/[id]]', err);
    return apiError('Failed to update category', 500);
  }
});

// DELETE /api/admin/categories/[id]
export const DELETE = withAdmin(async (request, { params }) => {
  try {
    const { id } = await params;
    await dbConnect();
    const cat = await CategoryTag.findByIdAndDelete(id);
    if (!cat) return apiError('Category not found', 404);

    await AdminLog.create({
      adminId: request.user._id,
      action: 'settings_updated',
      entityType: 'system',
      details: { action: 'DELETE_CATEGORY', id, name: cat.name },
    });

    return apiSuccess({ message: 'Category deleted' });
  } catch (err) {
    console.error('[DELETE /api/admin/categories/[id]]', err);
    return apiError('Failed to delete category', 500);
  }
});
