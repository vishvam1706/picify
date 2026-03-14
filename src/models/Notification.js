import mongoose, { Schema } from 'mongoose';

const NotificationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // recipient
  actorId: { type: Schema.Types.ObjectId, ref: 'User' }, // who triggered it
  type: {
    type: String,
    enum: ['like', 'comment', 'follow', 'save', 'mention', 'collab_invite', 'pin_saved', 'system'],
    required: true,
  },
  entityId: { type: Schema.Types.ObjectId },
  entityType: { type: String, enum: ['pin', 'board', 'comment', 'user'] },
  message: { type: String },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
// TTL: expires after 90 days
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
