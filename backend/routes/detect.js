const express = require('express');
const axios = require('axios');
const Upload = require('../models/Upload');
const Result = require('../models/Result');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Inference service URL (defaults to localhost for local dev / docker-compose)
const INFERENCE_URL = process.env.INFERENCE_URL || 'http://localhost:8000';

// Build the public URL for a given upload filename so the inference service
// can download the file when it doesn't share a local filesystem with the backend.
function buildFileUrl(req, filename) {
  const backendOrigin = `${req.protocol}://${req.get('host')}`;
  return `${backendOrigin}/uploads/${filename}`;
}

// POST /api/detect
router.post('/', protect, async (req, res) => {
  try {
    const { uploadId } = req.body;
    if (!uploadId) {
      return res.status(400).json({ error: 'uploadId required' });
    }

    const upload = await Upload.findById(uploadId);
    if (!upload) {
      return res.status(404).json({ error: 'Upload not found' });
    }

    // Call inference service
    const inferenceResponse = await axios.post(`${INFERENCE_URL}/detect`, {
      filePath: upload.path,
      fileUrl: buildFileUrl(req, upload.filename),
      uploadId: uploadId,
    });

    const { prediction, confidence, heatmap } = inferenceResponse.data;

    const result = new Result({
      uploadId,
      prediction,
      confidence,
      heatmap,
    });

    await result.save();

    // Emit WebSocket update
    // Assuming wss is accessible, but for simplicity, we'll skip for now

    res.json({ resultId: result._id, prediction, confidence });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Detection failed' });
  }
});

// POST /api/detect/compare (Admin only comparison)
router.post('/compare', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
    }

    const { uploadId } = req.body;
    if (!uploadId) {
      return res.status(400).json({ error: 'uploadId required' });
    }

    const upload = await Upload.findById(uploadId);
    if (!upload) {
      return res.status(404).json({ error: 'Upload not found' });
    }

    // Call inference service's compare endpoint
    const inferenceResponse = await axios.post(`${INFERENCE_URL}/compare`, {
      filePath: upload.path,
      fileUrl: buildFileUrl(req, upload.filename),
      uploadId: uploadId,
    });

    res.json(inferenceResponse.data);
  } catch (error) {
    console.error('Model comparison scan failed:', error);
    res.status(500).json({ error: 'Comparative model analysis failed.' });
  }
});

module.exports = router;
