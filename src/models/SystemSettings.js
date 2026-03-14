import mongoose, { Schema } from 'mongoose';

const SystemSettingsSchema = new Schema({
  trending: {
    weightViews: { type: Number, default: 1 },
    weightSaves: { type: Number, default: 3 },
    weightLikes: { type: Number, default: 2 },
    decayFactor: { type: Number, default: 0.9 },
  },
  aiModeration: {
    nsfwThreshold: { type: Number, default: 0.7 },
    autoReject: { type: Boolean, default: false },
  },
  upload: {
    maxFileSize: { type: Number, default: 20 }, // MB
    allowedFormats: { type: [String], default: ['jpg', 'jpeg', 'png', 'webp', 'gif'] },
  },
  platform: {
    maintenanceMode: { type: Boolean, default: false },
    registrationOpen: { type: Boolean, default: true },
  },
  updatedAt: { type: Date, default: Date.now },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
});

export default mongoose.models.SystemSettings ||
  mongoose.model('SystemSettings', SystemSettingsSchema);
