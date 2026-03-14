import { withAuth, apiSuccess, apiError } from '@/lib/apiHelpers';

export const POST = withAuth(async (request) => {
  const user = request.user;
  const { password } = await request.json();

  if (!user.twoFactorEnabled) {
    return apiError('2FA is not enabled', 400);
  }

  if (user.accountType === 'email') {
    if (!password) return apiError('Password is required to disable 2FA', 400);
    const { comparePassword } = await import('@/lib/auth');
    const valid = await comparePassword(password, user.password);
    if (!valid) return apiError('Invalid password', 401);
  }

  user.twoFactorEnabled = false;
  user.twoFactorSecret = undefined;
  await user.save();

  return apiSuccess({ message: '2FA disabled successfully' });
});
