import { NextResponse } from 'next/server';
import axios from 'axios';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { signToken } from '@/lib/auth';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const frontendUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (error || !code) {
    return NextResponse.redirect(`${frontendUrl}/login?error=GoogleAuthFailed`);
  }

  try {
    // 1. Exchange code for tokens
    const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      code,
      redirect_uri: process.env.GOOGLE_CALLBACK_URL,
      grant_type: 'authorization_code',
    });

    const { id_token, access_token } = tokenRes.data;

    // 2. Get user info
    const userRes = await axios.get(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`,
      { headers: { Authorization: `Bearer ${id_token}` } }
    );

    const { id: googleId, email, name, picture } = userRes.data;

    await dbConnect();

    // 3. Find or create user
    let user = await User.findOne({ 
      $or: [{ googleId }, { email: email.toLowerCase() }],
      isDeleted: false 
    });

    if (user) {
      if (!user.isActive) {
        return NextResponse.redirect(`${frontendUrl}/login?error=AccountDeactivated`);
      }
      // Link Google ID if registered via email
      if (!user.googleId) {
        user.googleId = googleId;
        user.accountType = 'google';
        user.isVerified = true;
        await user.save();
      }
    } else {
      // Create new Google user
      // Generate safe unique username (base username + random chars)
      let baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      if (baseUsername.length < 3) baseUsername += 'user';
      let username = baseUsername;
      let counter = 1;
      
      while (await User.exists({ username })) {
        username = `${baseUsername}${counter}`;
        counter++;
      }

      user = await User.create({
        email: email.toLowerCase(),
        googleId,
        username,
        displayName: name,
        profileImage: picture,
        accountType: 'google',
        isVerified: true,
        emailVerified: true,
      });
    }

    // 4. Issue JWT and redirect (2FA is skipped for OAuth logic here, but could be added)
    const token = signToken({ id: user._id, username: user.username, role: user.role });

    const response = NextResponse.redirect(`${frontendUrl}/`);
    
    response.cookies.set('picify_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;

  } catch (err) {
    console.error('[google-callback]', err?.response?.data || err.message);
    return NextResponse.redirect(`${frontendUrl}/login?error=GoogleAuthFailed`);
  }
}
