import dbConnect from '@/lib/db';
import User from '@/models/User';
import { withAuth, apiSuccess, apiError } from '@/lib/apiHelpers';

export const PATCH = withAuth(async (request) => {
  try {
    await dbConnect();
    const body = await request.json();
    
    // Allowed fields for update
    const allowedFields = [
      'displayName', 'username', 'bio', 'portfolioUrl', 'profileImage', 
      'coverImage', 'privacy', 'notificationPreferences', 'themePreference', 'isCreator',
      'brandCollabsEnabled', 'creatorSubscriptionsEnabled', 'subscriptionPrice', 'tipsEnabled'
    ];
    
    const updates = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return apiError('No valid fields provided for update', 400);
    }

    const user = await User.findByIdAndUpdate(
      request.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password -twoFactorSecret');

    return apiSuccess({ user });
  } catch (err) {
    console.error('[PATCH user me]', err);
    return apiError('Failed to update profile', 500);
  }
});

export const DELETE = withAuth(async (request) => {
  try {
    await dbConnect();
    
    // Soft delete
    const user = await User.findById(request.user._id);
    user.isDeleted = true;
    user.isActive = false;
    user.email = `${user.email}_deleted_${Date.now()}`; // free up email
    user.username = `${user.username}_deleted_${Date.now()}`; // free up username
    await user.save();

    // In a real app we might enqueue a worker here to soft-delete all their pins/boards
    
    const { clearAuthCookie } = await import('@/lib/auth');
    await clearAuthCookie();

    return apiSuccess({ message: 'Account deleted successfully' });
  } catch (err) {
    console.error('[DELETE user me]', err);
    return apiError('Failed to delete account', 500);
  }
});
