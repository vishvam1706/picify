import mongoose, { Schema } from 'mongoose';

const AnalyticsSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  pinId: { type: Schema.Types.ObjectId, ref: 'Pin', default: null },
  boardId: { type: Schema.Types.ObjectId, ref: 'Board', default: null },
  date: { type: Date, required: true },
  views: { type: Number, default: 0 },
  saves: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
  shares: { type: Number, default: 0 },
  profileViews: { type: Number, default: 0 },
  newFollowers: { type: Number, default: 0 },
  engagement: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

AnalyticsSchema.index({ userId: 1, date: -1 });
AnalyticsSchema.index({ pinId: 1, date: -1 });
// TTL: expires after 365 days
AnalyticsSchema.index({ date: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

export default mongoose.models.Analytics || mongoose.model('Analytics', AnalyticsSchema);
