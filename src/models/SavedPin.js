import mongoose, { Schema } from 'mongoose';

const SavedPinSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  pinId: { type: Schema.Types.ObjectId, ref: 'Pin', required: true },
  boardId: { type: Schema.Types.ObjectId, ref: 'Board', default: null },
  savedAt: { type: Date, default: Date.now },
});

SavedPinSchema.index({ userId: 1, pinId: 1 }, { unique: true });
SavedPinSchema.index({ boardId: 1 });
SavedPinSchema.index({ userId: 1, savedAt: -1 });

export default mongoose.models.SavedPin || mongoose.model('SavedPin', SavedPinSchema);
