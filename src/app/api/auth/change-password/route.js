import dbConnect from '@/lib/db';
import User from '@/models/User';
import { withAuth, apiSuccess, apiError } from '@/lib/apiHelpers';
import { comparePassword, hashPassword } from '@/lib/auth';

// POST /api/auth/change-password — change password while logged in
export const POST = withAuth(async (request) => {
  try {
    await dbConnect();
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return apiError('Current password and new password are required', 400);
    }
    if (newPassword.length < 8) {
      return apiError('New password must be at least 8 characters', 400);
    }

    // Fetch user WITH the password field (it's normally excluded)
    const user = await User.findById(request.user._id).select('+password');
    if (!user) return apiError('User not found', 404);

    // If they have no password (OAuth-only account) let them set one directly
    if (user.password) {
      const valid = await comparePassword(currentPassword, user.password);
      if (!valid) {
        return apiError('Current password is incorrect', 401);
      }
    }

    user.password = await hashPassword(newPassword);
    await user.save();

    return apiSuccess({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('[POST change-password]', err);
    return apiError('Failed to update password', 500);
  }
});
