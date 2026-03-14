import { withAuth, apiSuccess } from '@/lib/apiHelpers';

export const GET = withAuth(async (request) => {
  const user = request.user;
  
  return apiSuccess({
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
      followersCount: user.followersCount,
      followingCount: user.followingCount,
    }
  });
});
