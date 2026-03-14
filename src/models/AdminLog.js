import mongoose, { Schema } from 'mongoose';

const AdminLogSchema = new Schema({
  adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: {
    type: String,
    enum: [
      'user_verified', 'user_banned', 'user_unban', 'content_deleted',
      'report_reviewed', 'report_dismissed', 'report_resolved',
      'settings_updated', 'creator_approved', 'pin_removed', 'board_removed',
    ],
    required: true,
  },
  entityId: { type: Schema.Types.ObjectId },
  entityType: { type: String, enum: ['user', 'pin', 'board', 'comment', 'report', 'system'] },
  details: { type: Schema.Types.Mixed },
  ipAddress: { type: String },
  createdAt: { type: Date, default: Date.now },
});

AdminLogSchema.index({ adminId: 1, createdAt: -1 });
AdminLogSchema.index({ createdAt: -1 });

export default mongoose.models.AdminLog || mongoose.model('AdminLog', AdminLogSchema);
