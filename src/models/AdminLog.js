import mongoose, { Schema } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const AdminLogSchema = new Schema({
  adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: {
    type: String,
    // Open-ended — don't use a restrictive enum so new actions don't silently fail
    required: true,
  },
  entityId: { type: Schema.Types.ObjectId },
  entityType: { type: String },
  details: { type: Schema.Types.Mixed },
  ipAddress: { type: String },
}, { timestamps: true });

AdminLogSchema.index({ adminId: 1, createdAt: -1 });
AdminLogSchema.index({ createdAt: -1 });
AdminLogSchema.index({ action: 1 });

AdminLogSchema.plugin(mongoosePaginate);

// Delete cached model to ensure paginate plugin is applied on hot-reload
if (mongoose.models.AdminLog) delete mongoose.models.AdminLog;

export default mongoose.model('AdminLog', AdminLogSchema);
