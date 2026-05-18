import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import SystemSettings from '@/models/SystemSettings';
import { hashPassword, signToken } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/apiHelpers';
import { sendEmail } from '@/lib/email';

export async function POST(request) {
  try {
    await dbConnect();

    // ── Registration gate ────────────────────────────────────────────────
    const settings = await SystemSettings.findOne().lean();
    if (settings?.platform?.registrationOpen === false) {
      return apiError('Registrations are currently closed. Please check back later.', 403);
    }

    const body = await request.json();
    const { email, password, username, displayName } = body;

    // Validation
    if (!email || !password || !username) {
      return apiError('Email, password, and username are required', 400);
    }
    if (password.length < 8) {
      return apiError('Password must be at least 8 characters', 400);
    }
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      return apiError('Username must be 3-30 characters, only letters, numbers, underscores', 400);
    }

    // Check duplicates
    const existing = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
    });
    if (existing) {
      const field = existing.email === email.toLowerCase() ? 'Email' : 'Username';
      return apiError(`${field} is already taken`, 409);
    }

    // Create user
    const hashed = await hashPassword(password);
    const verifyToken = crypto.randomBytes(32).toString('hex');

    const user = await User.create({
      email: email.toLowerCase(),
      password: hashed,
      username: username.toLowerCase(),
      displayName: displayName || username,
      accountType: 'email',
      emailVerifyToken: verifyToken,
    });

    // Send verification email (non-blocking)
    try {
      const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${verifyToken}`;
      await sendEmail({
        to: email,
        subject: 'Welcome to Picify — Verify your email',
        templateName: 'welcome',
        variables: { displayName: user.displayName, verifyUrl },
      });
    } catch { /* email failure is non-fatal */ }

    // Issue JWT
    const token = signToken({ id: user._id, username: user.username });

    const response = apiSuccess(
      {
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          profileImage: user.profileImage,
          isVerified: user.isVerified,
          role: user.role,
        },
      },
      201
    );

    response.cookies.set('picify_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err) {
    console.error('[register]', err);
    return apiError('Registration failed', 500);
  }
}
