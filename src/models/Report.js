import mongoose, { Schema } from 'mongoose';

const ReportSchema = new Schema(
  {
    reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    entityType: { type: String, enum: ['pin', 'user', 'comment', 'board'], required: true },
    reason: {
      type: String,
      enum: ['spam', 'inappropriate', 'copyright', 'harassment', 'other'],
      required: true,
    },
    description: { type: String, maxlength: 500 },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
      default: 'pending',
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewNotes: { type: String },
  },
  { timestamps: true }
);

ReportSchema.index({ status: 1, createdAt: -1 });
ReportSchema.index({ entityId: 1 });

export default mongoose.models.Report || mongoose.model('Report', ReportSchema);
