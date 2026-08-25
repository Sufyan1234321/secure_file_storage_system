import mongoose from 'mongoose';

const folderSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 60 },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }
}, { timestamps: true });

folderSchema.index({ owner: 1, name: 1 }, { unique: true });

export default mongoose.model('Folder', folderSchema);
