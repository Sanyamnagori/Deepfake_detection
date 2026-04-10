const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  uploadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Upload', required: true },
  prediction: { type: String, enum: ['real', 'fake', 'error'], required: true },
  confidence: { type: Number, min: 0, max: 1, required: true },
  heatmap: { type: String }, // Base64 encoded image or path
  processedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Result', resultSchema);
