import mongoose, { Schema } from 'mongoose';

const BlockedUserSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  blockedUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  blockedAt: { type: Date, default: Date.now },
});

BlockedUserSchema.index({ userId: 1, blockedUserId: 1 }, { unique: true });
BlockedUserSchema.index({ userId: 1 });

export default mongoose.models.BlockedUser || mongoose.model('BlockedUser', BlockedUserSchema);
