import mongoose, { Schema } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const UserSchema = new Schema(
  {
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    password: { type: String },
    username: { type: String, unique: true, required: true, trim: true, lowercase: true },
    displayName: { type: String, trim: true },
    bio: { type: String, maxlength: 500 },
    portfolioUrl: { type: String },
    profileImage: { type: String },
    coverImage: { type: String },
    isVerified: { type: Boolean, default: false },
    isCreator: { type: Boolean, default: true },
    stripeConnectedAccountId: { type: String },
    stripeCustomerId: { type: String },
    tipsEnabled: { type: Boolean, default: false },
    brandCollabsEnabled: { type: Boolean, default: false },
    creatorSubscriptionsEnabled: { type: Boolean, default: false },
    subscriptionPrice: { type: Number, default: 499 },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    accountType: { type: String, enum: ['email', 'google', 'guest'], default: 'email' },
    googleId: { type: String, unique: true, sparse: true },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String },
    emailVerified: { type: Boolean, default: false },
    emailVerifyToken: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    privacy: {
      isPublic: { type: Boolean, default: true },
      showSavedPins: { type: Boolean, default: true },
      showFollowers: { type: Boolean, default: true },
    },
    notificationPreferences: {
      likes: { type: Boolean, default: true },
      comments: { type: Boolean, default: true },
      follows: { type: Boolean, default: true },
      saves: { type: Boolean, default: true },
      weeklyDigest: { type: Boolean, default: false },
    },
    themePreference: { type: String, enum: ['light', 'dark', 'auto'], default: 'auto' },
    followers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    lastLogin: { type: Date },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ googleId: 1 });
UserSchema.plugin(mongoosePaginate);

export default mongoose.models.User || mongoose.model('User', UserSchema);
