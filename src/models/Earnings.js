import mongoose, { Schema } from 'mongoose';

const EarningsSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['tip', 'subscription', 'sponsored_pin', 'affiliate', 'brand_deal'],
    required: true,
  },
  amount: { type: Number, required: true }, // in cents
  currency: { type: String, default: 'USD' },
  status: { type: String, enum: ['pending', 'completed', 'refunded', 'failed'], default: 'pending' },
  fromUserId: { type: Schema.Types.ObjectId, ref: 'User' },
  pinId: { type: Schema.Types.ObjectId, ref: 'Pin' },
  note: { type: String, maxlength: 500 },
  stripePaymentIntentId: { type: String },
  paidOutAt: { type: Date },
}, { timestamps: true });

EarningsSchema.index({ userId: 1, createdAt: -1 });
EarningsSchema.index({ userId: 1, type: 1 });

export default mongoose.models.Earnings || mongoose.model('Earnings', EarningsSchema);
