import mongoose, { Schema } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const ImageSchema = new Schema({
  url: { type: String, required: true },
  publicId: { type: String }, // Cloudinary public_id
  width: Number,
  height: Number,
  size: Number,
  format: String,
  isCompressed: { type: Boolean, default: false },
}, { _id: false });

const PinSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, maxlength: 200 },
    description: { type: String, maxlength: 2000 },
    images: [ImageSchema],
    isPrimaryCarousel: { type: Boolean, default: false },
    sourceLink: { type: String },
    tags: [{ type: String, trim: true, lowercase: true }],
    categories: [{ type: String, trim: true }],
    colorPalette: [{ type: String }],
    aiCaption: { type: String },
    aiDescription: { type: String },
    aiTitle: { type: String },
    aiHashtags: [{ type: String }],
    imageHash: { type: String },
    isPublic: { type: Boolean, default: true },
    isDraft: { type: Boolean, default: false },
    isNSFW: { type: Boolean, default: false },
    nsfwScore: { type: Number },
    orientation: { type: String, enum: ['portrait', 'landscape', 'square'] },
    boardId: { type: Schema.Types.ObjectId, ref: 'Board' },
    collaborators: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    affiliateLink: { type: String, trim: true },
    isSponsored: { type: Boolean, default: false },
    scheduledFor: { type: Date },
    publishedAt: { type: Date },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    likesCount: { type: Number, default: 0 },
    saves: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    savesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    viewedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

PinSchema.index({ userId: 1 });
PinSchema.index({ boardId: 1 });
PinSchema.index({ tags: 1 });
PinSchema.index({ categories: 1 });
PinSchema.index({ createdAt: -1 });
PinSchema.index({ isPublic: 1, isDeleted: 1, publishedAt: -1 });
PinSchema.index({ title: 'text', description: 'text', tags: 'text' });
PinSchema.plugin(mongoosePaginate);

export default mongoose.models.Pin || mongoose.model('Pin', PinSchema);
