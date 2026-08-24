import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
  originalName: { type: String, required: true, trim: true },
  storageName: { type: String, required: true, unique: true },
  size: { type: Number, required: true, min: 0 },
  mimeType: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  isPublic: { type: Boolean, default: false },
  shareToken: { type: String, unique: true, sparse: true, select: false }
}, { timestamps: true });

export default mongoose.model('File', fileSchema);
