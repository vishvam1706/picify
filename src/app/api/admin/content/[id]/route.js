import dbConnect from '@/lib/db';
import Pin from '@/models/Pin';
import AdminLog from '@/models/AdminLog';
import { withAdmin, apiSuccess, apiError } from '@/lib/apiHelpers';

// DELETE /api/admin/content/[id]
export const DELETE = withAdmin(async (request, { params }) => {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'pin'; // 'pin' | 'board'
    const reason = searchParams.get('reason') || 'Removed by admin';

    await dbConnect();

    let Model;
    let targetModel;
    if (type === 'board') {
      Model = (await import('@/models/Board')).default;
      targetModel = 'Board';
    } else {
      Model = Pin;
      targetModel = 'Pin';
    }

    const doc = await Model.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    if (!doc) return apiError('Content not found', 404);

    await AdminLog.create({
      adminId: request.user._id,
      action: 'DELETE_CONTENT',
      targetId: id,
      targetModel,
      details: { type, reason }
    });

    return apiSuccess({ message: `${type} deleted successfully` });
  } catch (err) {
    console.error('[DELETE admin/content/[id]]', err);
    return apiError('Failed to delete content', 500);
  }
});
