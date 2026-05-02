import dbConnect from '@/lib/db';
import User from '@/models/User';
import AdminLog from '@/models/AdminLog';
import { withAdmin, apiSuccess, apiError } from '@/lib/apiHelpers';

// PATCH /api/admin/users/[id]/verify  — verify user account
// PATCH /api/admin/users/[id]/ban    — ban/unban user

export const PATCH = withAdmin(async (request, { params }) => {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, reason } = body;

    if (!['verify', 'unverify', 'ban', 'unban', 'delete', 'restore', 'make_creator', 'remove_creator'].includes(action)) {
      return apiError('Invalid action. Use: verify, unverify, ban, unban, delete, restore, make_creator, remove_creator', 400);
    }

    await dbConnect();

    const user = await User.findById(id).select('-password -twoFactorSecret');
    if (!user) return apiError('User not found', 404);

    // Prevent acting on another admin
    if (user.role === 'admin') {
      return apiError('Cannot perform actions on admin accounts', 403);
    }

    let update = {};
    let logAction = '';

    switch (action) {
      case 'verify':
        update = { isVerified: true };
        logAction = 'VERIFY_USER';
        break;
      case 'unverify':
        update = { isVerified: false };
        logAction = 'UNVERIFY_USER';
        break;
      case 'ban':
        update = { isActive: false, banReason: reason || 'Violated community guidelines' };
        logAction = 'BAN_USER';
        break;
      case 'unban':
        update = { isActive: true, banReason: null };
        logAction = 'UNBAN_USER';
        break;
      case 'delete':
        update = { isDeleted: true, isActive: false };
        logAction = 'DELETE_USER';
        break;
      case 'restore':
        update = { isDeleted: false, isActive: true };
        logAction = 'RESTORE_USER';
        break;
      case 'make_creator':
        update = { isCreator: true };
        logAction = 'MAKE_CREATOR';
        break;
      case 'remove_creator':
        update = { isCreator: false };
        logAction = 'REMOVE_CREATOR';
        break;
    }

    const updated = await User.findByIdAndUpdate(id, update, { new: true }).select('-password -twoFactorSecret');

    await AdminLog.create({
      adminId: request.user._id,
      action: logAction,
      targetId: user._id,
      targetModel: 'User',
      details: { reason, previousState: { isActive: user.isActive, isVerified: user.isVerified } }
    });

    return apiSuccess(updated);
  } catch (err) {
    console.error('[PATCH admin/users/[id]]', err);
    return apiError('Action failed', 500);
  }
});

export const DELETE = withAdmin(async (request, { params }) => {
  try {
    const { id } = await params;
    await dbConnect();

    const user = await User.findById(id);
    if (!user) return apiError('User not found', 404);
    if (user.role === 'admin') return apiError('Cannot delete admin accounts', 403);

    user.isDeleted = true;
    user.isActive = false;
    user.email = `deleted_${Date.now()}_${user.email}`;
    await user.save();

    await AdminLog.create({
      adminId: request.user._id,
      action: 'HARD_DELETE_USER',
      targetId: user._id,
      targetModel: 'User',
    });

    return apiSuccess({ message: 'User deleted' });
  } catch (err) {
    console.error('[DELETE admin/users/[id]]', err);
    return apiError('Failed to delete user', 500);
  }
});
