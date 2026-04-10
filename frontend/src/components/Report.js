import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Download, CheckCircle, XCircle, RotateCcw, AlertTriangle } from 'lucide-react';
import { downloadReport, getResultDetails } from '../api';

const Report = ({ resultId, onReset }) => {
  const navigate = useNavigate();
  const { resultId: paramResultId } = useParams();
  const currentResultId = resultId || paramResultId;
  const [downloading, setDownloading] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResult = async () => {
      try {
        // Fetch result details from backend API via axios client
        const response = await getResultDetails(currentResultId);
        setResult(response.data);
      } catch (error) {
        console.error('Error fetching result:', error);
        setError('Failed to load result details');
      } finally {
        setLoading(false);
      }
    };

    if (currentResultId) {
      fetchResult();
    }
  }, [currentResultId]);

  const handleDownload = async () => {
    setDownloading(true);
    setError('');
    try {
      const response = await downloadReport(currentResultId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `deepfake_report_${currentResultId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download failed:', error);
      setError('Failed to download report. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'confidence-high';
    if (confidence >= 60) return 'confidence-medium';
    return 'confidence-low';
  };

  const getPredictionIcon = (prediction) => {
    if (prediction === 'error') {
      return <AlertTriangle size={48} style={{ color: '#f59e0b' }} />;
    }
    return prediction === 'real' ? (
      <CheckCircle size={48} style={{ color: '#10b981' }} />
    ) : (
      <XCircle size={48} style={{ color: '#ef4444' }} />
    );
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div className="loading-spinner" style={{ width: '40px', height: '40px', margin: '0 auto 1rem' }}></div>
        <p>Loading results...</p>
      </div>
    );
  }

  // If we failed to load or no result data is available, show a friendly message
  if (!result) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h2 style={{ marginBottom: '1rem', color: '#1e293b', fontSize: '1.5rem', fontWeight: '600' }}>
          Analysis Results
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
          {error || 'No result data available for this analysis.'}
        </p>
        <button
          onClick={() => navigate('/')}
          className="btn"
        >
          Go back to Home
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem', color: '#1e293b', fontSize: '1.5rem', fontWeight: '600' }}>
        Analysis Results
      </h2>

      <div className="result-card">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          {getPredictionIcon(result.prediction)}
          <h3 style={{
            fontSize: '1.8rem',
            fontWeight: '700',
            color: result.prediction === 'error' ? '#f59e0b' : (result.prediction === 'real' ? '#10b981' : '#ef4444'),
            margin: '1rem 0 0.5rem 0',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            {result.prediction === 'error' ? 'Analysis Failed' : (result.prediction === 'real' ? 'Authentic Media' : 'Deepfake Detected')}
          </h3>
          <p style={{ color: '#6b7280', margin: '0' }}>
            {result.prediction === 'error'
              ? 'Our AI analysis failed to process this media due to an internal error or incompatible format.'
              : (result.prediction === 'real'
                ? 'Our AI analysis indicates this media appears to be authentic.'
                : 'Our AI has detected potential deepfake manipulation in this media.')
            }
          </p>
        </div>

        <div className="result-details">
          <div className="result-item">
            <span className="result-label">File Analyzed</span>
            <span className="result-value">{result.fileName}</span>
          </div>
          <div className="result-item">
            <span className="result-label">Prediction</span>
            <span className="result-value" style={{
              color: result.prediction === 'real' ? '#10b981' : '#ef4444',
              fontWeight: '700'
            }}>
              {result.prediction.toUpperCase()}
            </span>
          </div>
          <div className="result-item">
            <span className="result-label">Confidence Score</span>
            <span className={`result-value ${getConfidenceColor(result.confidence)}`}>
              {result.confidence}%
            </span>
          </div>
          <div className="result-item">
            <span className="result-label">Analysis Completed</span>
            <span className="result-value">
              {result.processedAt ? new Date(result.processedAt).toLocaleString() : 'N/A'}
            </span>
          </div>
        </div>
        
      </div>

      {result.prediction === 'fake' && (
        <div className="error-message" style={{ marginBottom: '2rem' }}>
          <AlertTriangle size={20} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          <strong>Warning:</strong> This media has been flagged as potentially manipulated.
          We recommend further verification and caution when sharing.
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="btn"
          style={{ flex: 1 }}
        >
          {downloading ? (
            <>
              <div className="loading-spinner"></div>
              Generating...
            </>
          ) : (
            <>
              <Download size={20} style={{ marginRight: '0.5rem' }} />
              Download Report
            </>
          )}
        </button>

        <button
          onClick={() => navigate('/')}
          className="btn"
          style={{ flex: 1, background: 'transparent', color: '#667eea', border: '2px solid #667eea' }}
        >
          <RotateCcw size={20} style={{ marginRight: '0.5rem' }} />
          Analyze Another
        </button>
      </div>
    </div>
  );
};

export default Report;
