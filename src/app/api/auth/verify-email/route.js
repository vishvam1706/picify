import dbConnect from '@/lib/db';
import User from '@/models/User';
import { apiSuccess, apiError } from '@/lib/apiHelpers';

export async function POST(request) {
  try {
    await dbConnect();
    const { token } = await request.json();

    if (!token) {
      return apiError('Verification token is required', 400);
    }

    const user = await User.findOne({ emailVerifyToken: token, isDeleted: false });

    if (!user) {
      return apiError('Invalid verification token', 400);
    }

    if (user.isVerified) {
      return apiSuccess({ message: 'Email is already verified' });
    }

    user.isVerified = true;
    user.emailVerified = true;
    user.emailVerifyToken = undefined;
    await user.save();

    return apiSuccess({ message: 'Email verified successfully' });
  } catch (err) {
    console.error('[verify-email]', err);
    return apiError('Failed to verify email', 500);
  }
}
