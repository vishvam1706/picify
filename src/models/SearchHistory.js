import mongoose, { Schema } from 'mongoose';

const SearchHistorySchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  query: { type: String, required: true, trim: true },
  type: { type: String, enum: ['keyword', 'tag', 'category', 'visual'], default: 'keyword' },
  filters: { type: Schema.Types.Mixed },
  resultsCount: { type: Number, default: 0 },
  searchedAt: { type: Date, default: Date.now },
});

SearchHistorySchema.index({ userId: 1, searchedAt: -1 });
// TTL: expires after 90 days
SearchHistorySchema.index({ searchedAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export default mongoose.models.SearchHistory || mongoose.model('SearchHistory', SearchHistorySchema);
