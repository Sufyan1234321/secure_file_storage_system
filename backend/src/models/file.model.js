import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
  originalName: { type: String, required: true, trim: true },
  folder: { type: String, required: true, trim: true, maxlength: 60, default: 'General', index: true },
  storageName: { type: String, required: true, unique: true },
  size: { type: Number, required: true, min: 0 },
  mimeType: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  isTrashed: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, default: null },
  isPublic: { type: Boolean, default: false },
  shareToken: { type: String, unique: true, sparse: true, select: false }
}, { timestamps: true });

export default mongoose.model('File', fileSchema);
