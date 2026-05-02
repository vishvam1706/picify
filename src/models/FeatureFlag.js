import mongoose, { Schema } from 'mongoose';

const FeatureFlagSchema = new Schema({
  key: { type: String, required: true, unique: true, trim: true },
  label: { type: String, required: true },
  description: { type: String },
  enabled: { type: Boolean, default: false },
  rolloutPercent: { type: Number, default: 100, min: 0, max: 100 },
  targetRoles: { type: [String], default: ['user', 'creator', 'admin'] },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.models.FeatureFlag || mongoose.model('FeatureFlag', FeatureFlagSchema);
