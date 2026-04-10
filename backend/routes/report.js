const express = require('express');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const Upload = require('../models/Upload');
const Result = require('../models/Result');

const router = express.Router();

// GET /api/report/:resultId
router.get('/:resultId', async (req, res) => {
  try {
    const { resultId } = req.params;
    const result = await Result.findById(resultId).populate('uploadId');
    if (!result) {
      return res.status(404).json({ error: 'Result not found' });
    }

    // Generate PDF report and send directly
    const doc = new PDFDocument();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=report_${resultId}.pdf`);

    doc.pipe(res);

    doc.fontSize(25).text('DeepFake Detection Report', 100, 100);
    doc.fontSize(12).text(`File: ${result.uploadId.originalName}`, 100, 150);
    doc.text(`Prediction: ${result.prediction}`, 100, 170);
    doc.text(`Confidence: ${(result.confidence * 100).toFixed(2)}%`, 100, 190);
    doc.text(`Processed At: ${result.processedAt}`, 100, 210);

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Report generation failed' });
  }
});

module.exports = router;
