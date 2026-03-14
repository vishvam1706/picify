import speakeasy from 'speakeasy';
import { withAuth, apiSuccess, apiError } from '@/lib/apiHelpers';

export const POST = withAuth(async (request) => {
  const user = request.user;
  const { token } = await request.json();

  if (!token) return apiError('Verification token is required', 400);
  if (user.twoFactorEnabled) return apiError('2FA is already enabled', 400);
  if (!user.twoFactorSecret) return apiError('2FA setup not initiated', 400);

  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token,
    window: 1 // Allow 30 seconds clock drift
  });

  if (!verified) {
    return apiError('Invalid verification code', 400);
  }

  // Confirm and enable
  user.twoFactorEnabled = true;
  await user.save();

  return apiSuccess({ message: '2FA enabled successfully' });
});
