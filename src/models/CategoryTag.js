import mongoose, { Schema } from 'mongoose';

const CategoryTagSchema = new Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  type: { type: String, enum: ['category', 'tag'], default: 'category' },
  description: { type: String, maxlength: 500 },
  coverImage: { type: String },
  color: { type: String, default: '#e60023' },
  emoji: { type: String },
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 },
  pinsCount: { type: Number, default: 0 },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

CategoryTagSchema.index({ slug: 1 });
CategoryTagSchema.index({ type: 1, isActive: 1, sortOrder: 1 });

export default mongoose.models.CategoryTag || mongoose.model('CategoryTag', CategoryTagSchema);
