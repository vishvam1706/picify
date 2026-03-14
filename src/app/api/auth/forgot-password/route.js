import crypto from 'crypto';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { apiSuccess, apiError } from '@/lib/apiHelpers';
import { sendEmail } from '@/lib/email';

export async function POST(request) {
  try {
    await dbConnect();
    const { email } = await request.json();

    if (!email) return apiError('Email is required', 400);

    const user = await User.findOne({ email: email.toLowerCase(), isDeleted: false });
    
    // Always return success even if user not found (security best practice)
    if (!user || !user.isActive || user.accountType === 'google') {
      return apiSuccess({ message: 'If an account exists, a recovery email has been sent.' });
    }

    // Generate token valid for 1 hour
    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000;
    await user.save();

    // Send email
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    await sendEmail({
      to: user.email,
      subject: 'Picify — Password Reset Request',
      templateName: 'reset-password',
      variables: { displayName: user.displayName, resetUrl },
    });

    return apiSuccess({ message: 'If an account exists, a recovery email has been sent.' });
  } catch (err) {
    console.error('[forgot-password]', err);
    return apiError('Failed to process request', 500);
  }
}
