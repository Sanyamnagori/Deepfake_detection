import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Brain, Loader2, BarChart3 } from 'lucide-react';
import { detectDeepfake } from '../api';

const Detect = ({ uploadId, onDetect }) => {
  const navigate = useNavigate();
  const { uploadId: paramUploadId } = useParams();
  const currentUploadId = uploadId || paramUploadId;
  const [detecting, setDetecting] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState({ progress: 0, currentFrame: 0, totalFrames: 0 });
  const [error, setError] = useState('');

  useEffect(() => {
    let ws;
    if (detecting && currentUploadId) {
      ws = new WebSocket(`ws://localhost:5000?uploadId=${currentUploadId}`);
      
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'progress') {
          setAnalysisProgress(message.data);
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
      };
    }

    return () => {
      if (ws) ws.close();
    };
  }, [detecting, currentUploadId]);

  const handleDetect = async () => {
    setDetecting(true);
    setAnalysisProgress({ progress: 0, currentFrame: 0, totalFrames: 0 });
    setError('');
    try {
      const response = await detectDeepfake(currentUploadId);
      navigate(`/report/${response.data.resultId}`);
    } catch (error) {
      console.error('Detection failed:', error);
      setError('Detection failed. Please try again.');
    } finally {
      setDetecting(false);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem', color: '#1e293b', fontSize: '1.5rem', fontWeight: '600' }}>
        AI Analysis
      </h2>

      <div className="result-card" style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <Brain size={48} style={{ color: '#667eea', marginBottom: '1rem' }} />
        <p style={{ color: '#475569', margin: '0 0 1rem 0' }}>
          Our advanced AI will analyze your media file for deepfake indicators using
          state-of-the-art computer vision and machine learning algorithms.
        </p>
        <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
          Upload ID: <span style={{ fontWeight: '600', color: '#1e293b' }}>{currentUploadId}</span>
        </div>
      </div>

      {detecting && (
        <div className="progress-container" style={{ marginBottom: '2rem' }}>
          <div className="progress-bar-wrapper">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${analysisProgress.progress}%` }}
            ></div>
          </div>
          <div className="progress-text">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart3 size={16} />
              <span>Analyzing frames...</span>
            </div>
            <span>{analysisProgress.progress}%</span>
          </div>
          {analysisProgress.totalFrames > 0 && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#6b7280', textAlign: 'center' }}>
              Processed {analysisProgress.currentFrame} of {analysisProgress.totalFrames} key samples
            </div>
          )}
        </div>
      )}

      {error && <div className="error-message" style={{ marginBottom: '1rem' }}>{error}</div>}

      <button
        onClick={handleDetect}
        disabled={detecting}
        className="btn secondary"
        style={{ width: '100%' }}
      >
        {detecting ? (
          <>
            <Loader2 size={20} className="loading-spinner" />
            Processing Media...
          </>
        ) : (
          <>
            <Brain size={20} style={{ marginRight: '0.5rem' }} />
            Start AI Analysis
          </>
        )}
      </button>
    </div>
  );
};

export default Detect;
