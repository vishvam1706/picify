import dbConnect from '@/lib/db';
import User from '@/models/User';
import { comparePassword, signToken } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/apiHelpers';

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { email, password, totpCode } = body;

    if (!email || !password) {
      return apiError('Email and password are required', 400);
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase(), isDeleted: false });
    if (!user) return apiError('Invalid email or password', 401);
    if (!user.isActive) return apiError('Account is deactivated', 403);
    if (user.accountType === 'google') {
      return apiError('This account uses Google login', 400);
    }

    // Verify password
    const valid = await comparePassword(password, user.password);
    if (!valid) return apiError('Invalid email or password', 401);

    // 2FA check
    if (user.twoFactorEnabled) {
      if (!totpCode) {
        // Signal to client that 2FA is required
        return apiSuccess({ requires2FA: true, userId: user._id }, 200);
      }
      const speakeasy = (await import('speakeasy')).default;
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: totpCode,
        window: 1,
      });
      if (!verified) return apiError('Invalid 2FA code', 401);
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = signToken({ id: user._id, username: user.username, role: user.role });

    const response = apiSuccess({
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        profileImage: user.profileImage,
        isVerified: user.isVerified,
        isCreator: user.isCreator,
        role: user.role,
        themePreference: user.themePreference,
      },
    });

    response.cookies.set('picify_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err) {
    console.error('[login]', err);
    return apiError('Login failed', 500);
  }
}
