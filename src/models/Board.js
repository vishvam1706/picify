import mongoose, { Schema } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const CollaboratorSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['editor', 'viewer'], default: 'editor' },
  addedAt: { type: Date, default: Date.now },
}, { _id: false });

const BoardSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, maxlength: 100 },
    description: { type: String, maxlength: 500 },
    coverImage: { type: String },
    slug: { type: String },
    isPublic: { type: Boolean, default: true },
    isCollaborative: { type: Boolean, default: false },
    collaborators: [CollaboratorSchema],
    parentFolderId: { type: Schema.Types.ObjectId, ref: 'BoardFolder' },
    pinsCount: { type: Number, default: 0 },
    followersCount: { type: Number, default: 0 },
    followers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

BoardSchema.index({ userId: 1 });
BoardSchema.index({ parentFolderId: 1 });
BoardSchema.index({ userId: 1, isDeleted: 1 });
BoardSchema.plugin(mongoosePaginate);

export default mongoose.models.Board || mongoose.model('Board', BoardSchema);
