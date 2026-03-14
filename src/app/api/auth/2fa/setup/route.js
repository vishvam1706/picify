import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { withAuth, apiSuccess, apiError } from '@/lib/apiHelpers';

export const POST = withAuth(async (request) => {
  const user = request.user;
  
  if (user.twoFactorEnabled) {
    return apiError('2FA is already enabled', 400);
  }

  // Generate secret
  const secret = speakeasy.generateSecret({
    name: `Picify (${user.email})`,
    issuer: 'Picify'
  });

  // Temporarily store secret on user (not enabled yet)
  user.twoFactorSecret = secret.base32;
  await user.save();

  // Generate QR code deep link URL
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

  return apiSuccess({
    secret: secret.base32,
    qrCodeUrl
  });
});
