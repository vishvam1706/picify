import mongoose, { Schema } from 'mongoose';

const WatchHistorySchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  pinId: { type: Schema.Types.ObjectId, ref: 'Pin', required: true },
  viewedAt: { type: Date, default: Date.now },
});

WatchHistorySchema.index({ userId: 1, viewedAt: -1 });
WatchHistorySchema.index({ userId: 1, pinId: 1 });
// TTL: expires after 30 days
WatchHistorySchema.index({ viewedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export default mongoose.models.WatchHistory || mongoose.model('WatchHistory', WatchHistorySchema);
