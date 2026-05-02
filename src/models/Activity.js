import mongoose, { Schema } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const ActivitySchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['pin_created', 'board_created', 'follow', 'save', 'like', 'comment'],
    required: true,
  },
  entityId: { type: Schema.Types.ObjectId },
  entityType: { type: String, enum: ['pin', 'board', 'user', 'comment'] },
  metadata: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
});

ActivitySchema.index({ userId: 1, createdAt: -1 });
// TTL: expires after 90 days
ActivitySchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

ActivitySchema.plugin(mongoosePaginate);

export default mongoose.models.Activity || mongoose.model('Activity', ActivitySchema);
