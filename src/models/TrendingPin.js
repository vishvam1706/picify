import mongoose, { Schema } from 'mongoose';

const TrendingPinSchema = new Schema({
  pinId: { type: Schema.Types.ObjectId, ref: 'Pin', required: true },
  category: { type: String, default: 'all' },
  score: { type: Number, default: 0 },
  rank: { type: Number },
  period: { type: String, enum: ['hourly', 'daily', 'weekly'], required: true },
  calculatedAt: { type: Date, default: Date.now },
});

TrendingPinSchema.index({ period: 1, rank: 1 });
TrendingPinSchema.index({ period: 1, category: 1, rank: 1 });
// TTL: hourly expires in 2h, daily in 26h, weekly in 8 days — use a single generous TTL
TrendingPinSchema.index({ calculatedAt: 1 }, { expireAfterSeconds: 8 * 24 * 60 * 60 });

export default mongoose.models.TrendingPin || mongoose.model('TrendingPin', TrendingPinSchema);
