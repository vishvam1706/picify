import mongoose, { Schema } from 'mongoose';

const BoardFolderSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, maxlength: 100 },
    description: { type: String, maxlength: 300 },
    boardsCount: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

BoardFolderSchema.index({ userId: 1 });

export default mongoose.models.BoardFolder || mongoose.model('BoardFolder', BoardFolderSchema);
