const express = require('express');
const Result = require('../models/Result');
const Upload = require('../models/Upload');

const router = express.Router();

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
