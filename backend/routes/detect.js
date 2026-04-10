const express = require('express');
const axios = require('axios');
const Upload = require('../models/Upload');
const Result = require('../models/Result');
const { protect } = require('../middleware/auth');

const router = express.Router();

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
    const inferenceResponse = await axios.post('http://localhost:8000/detect', {
      filePath: upload.path,
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

module.exports = router;
