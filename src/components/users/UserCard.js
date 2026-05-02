'use client';

import Link from 'next/link';
import Avatar from '@/components/ui/Avatar';
import FollowButton from './FollowButton';
import { useAuth } from '@/context/AuthContext';

export default function UserCard({ user: profileUser }) {
  const { user } = useAuth();
  const isOwner = user && user._id === profileUser._id;

  return (
    <div className="glass-card rounded-2xl p-4 flex flex-col items-center gap-3 hover:shadow-lg transition-shadow">
      <Link href={`/${profileUser.username}`} className="flex flex-col items-center gap-2">
        <Avatar src={profileUser.profileImage} alt={profileUser.username} size="lg" className="shadow-md" />
        <div className="text-center">
          <p className="font-semibold text-sm text-foreground leading-tight">
            {profileUser.displayName || profileUser.username}
          </p>
          <p className="text-xs text-muted-foreground">@{profileUser.username}</p>
        </div>
        {/* <p className="text-xs text-muted-foreground">
          {profileUser.followersCount || 0} followers
        </p> */}
      </Link>
      {!isOwner && (
        <FollowButton
          targetUserId={profileUser._id}
          initialFollowing={profileUser.isFollowing}
          className="w-full justify-center text-sm"
        />
      )}
    </div>
  );
}
