import mongoose, { Schema } from 'mongoose';

const AnnouncementSchema = new Schema({
  title: { type: String, required: true, maxlength: 200 },
  body: { type: String, required: true, maxlength: 2000 },
  type: { type: String, enum: ['info', 'warning', 'success', 'maintenance'], default: 'info' },
  isActive: { type: Boolean, default: true },
  isPinned: { type: Boolean, default: false },
  targetRole: { type: String, enum: ['all', 'creator', 'admin'], default: 'all' },
  expiresAt: { type: Date },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

AnnouncementSchema.index({ isActive: 1, createdAt: -1 });

export default mongoose.models.Announcement || mongoose.model('Announcement', AnnouncementSchema);
