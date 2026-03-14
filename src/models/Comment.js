import mongoose, { Schema } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const CommentSchema = new Schema(
  {
    pinId: { type: Schema.Types.ObjectId, ref: 'Pin', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, maxlength: 1000 },
    parentCommentId: { type: Schema.Types.ObjectId, ref: 'Comment', default: null },
    mentions: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isPinned: { type: Boolean, default: false },
    likesCount: { type: Number, default: 0 },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    repliesCount: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

CommentSchema.index({ pinId: 1, createdAt: -1 });
CommentSchema.index({ userId: 1 });
CommentSchema.index({ parentCommentId: 1 });
CommentSchema.plugin(mongoosePaginate);

export default mongoose.models.Comment || mongoose.model('Comment', CommentSchema);
