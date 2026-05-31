const express = require('express');
const Result = require('../models/Result');
const Upload = require('../models/Upload');

const router = express.Router();

// GET /api/result
router.get('/', async (req, res) => {
  try {
    const results = await Result.find()
      .populate('uploadId')
      .sort({ processedAt: -1 });

    const formatted = results.map(result => ({
      _id: result._id,
      prediction: result.prediction,
      confidence: Math.round(result.confidence * 100),
      processedAt: result.processedAt,
      fileName: result.uploadId ? result.uploadId.filename : 'unknown_file.jpg',
      originalName: result.uploadId ? result.uploadId.originalName : 'unknown_file.jpg',
      mimetype: result.uploadId ? result.uploadId.mimetype : 'image/jpeg',
      size: result.uploadId ? result.uploadId.size : 0
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching results history:', error);
    res.status(500).json({ error: 'Failed to fetch results history' });
  }
});

// GET /api/result/:resultId
router.get('/:resultId', async (req, res) => {
  try {
    const { resultId } = req.params;

    const result = await Result.findById(resultId).populate('uploadId');
    if (!result) {
      return res.status(404).json({ error: 'Result not found' });
    }

    // Format response with upload filename
    const response = {
      prediction: result.prediction,
      confidence: Math.round(result.confidence * 100), // Convert to percentage
      processedAt: result.processedAt,
      fileName: result.uploadId ? result.uploadId.filename : 'unknown_file.jpg',
      heatmap: result.heatmap
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching result:', error);
    res.status(500).json({ error: 'Failed to fetch result' });
  }
});

module.exports = router;
