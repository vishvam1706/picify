import crypto from 'crypto';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { hashPassword } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/apiHelpers';

export async function POST(request) {
  try {
    await dbConnect();
    const { token, password } = await request.json();

    if (!token || !password) {
      return apiError('Token and new password are required', 400);
    }
    if (password.length < 8) {
      return apiError('Password must be at least 8 characters', 400);
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
      isDeleted: false,
    });

    if (!user) {
      return apiError('Invalid or expired password reset token', 400);
    }

    // Update password, clear token
    user.password = await hashPassword(password);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return apiSuccess({ message: 'Password has been reset successfully. You can now login.' });
  } catch (err) {
    console.error('[reset-password]', err);
    return apiError('Failed to reset password', 500);
  }
}
