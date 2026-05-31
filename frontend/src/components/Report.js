import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Download, CheckCircle2, AlertOctagon, RotateCcw, ShieldAlert, Calendar, FileText, Activity } from 'lucide-react';
import { downloadReport, getResultDetails } from '../api';

const Report = ({ resultId }) => {
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

  const isVideoFile = (fileName) => {
    if (!fileName) return false;
    const ext = fileName.split('.').pop().toLowerCase();
    return ['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(ext);
  };

  if (loading) {
    return (
      <div className="main-container" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <div className="loading-spinner" style={{ width: '44px', height: '44px', margin: '0 auto 1.5rem', borderWidth: '3px', borderTopColor: '#00f2fe' }}></div>
        <p style={{ color: 'var(--gray-500)', fontWeight: '600' }}>Decrypting AI analysis database...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="main-container" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
        <ShieldAlert size={48} style={{ color: '#ef4444', marginBottom: '1.5rem' }} />
        <h2 style={{ marginBottom: '1rem', color: 'var(--white)', fontSize: '1.5rem', fontWeight: '800' }}>
          Diagnostics Offline
        </h2>
        <p style={{ color: 'var(--gray-500)', marginBottom: '2rem' }}>
          {error || 'No active analysis report could be retrieved for this session.'}
        </p>
        <button
          onClick={() => navigate('/')}
          className="btn-professional"
          style={{ borderRadius: 'var(--radius-md)', padding: '0.85rem 2rem' }}
        >
          Return to Command Deck
        </button>
      </div>
    );
  }

  const isReal = result.prediction === 'real';
  const isError = result.prediction === 'error';

  return (
    <div className="main-container" style={{ maxWidth: '960px' }}>
      <div className="header" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: '800', background: 'linear-gradient(120deg, #ffffff 40%, #00f2fe 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          AI Forensics Diagnostic Report
        </h1>
        <p style={{ color: 'var(--gray-500)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
          Neural verification audit completed successfully. View localization heatmap metrics below.
        </p>
      </div>

      <div className="result-card" style={{ padding: '2.5rem 2rem' }}>
        <div className="result-card-header">
          <div style={{ display: 'inline-flex', padding: '1rem', background: isReal ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)', border: isReal ? '1px solid rgba(16, 185, 129, 0.15)' : '1px solid rgba(239, 68, 68, 0.15)', borderRadius: 'var(--radius-lg)' }}>
            {isReal ? (
              <CheckCircle2 size={48} className="verdict-real" style={{ animation: 'none' }} />
            ) : (
              <AlertOctagon size={48} className="verdict-fake" style={{ animation: 'none' }} />
            )}
          </div>
          <h3 className={`result-verdict-title ${isReal ? 'verdict-real' : 'verdict-fake'}`}>
            {isError ? 'Diagnostics Error' : (isReal ? 'Verified Authentic' : 'Synthetic Media Detected')}
          </h3>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.95rem', margin: '0.5rem auto 0', maxWidth: '620px', lineHeight: '1.7' }}>
            {isError
              ? 'Our forensic scan crashed due to corrupted frame indexes or model weights mismatch.'
              : (isReal
                ? 'Our deep neural model indicates high confidence that this media contains organic facial details. No synthetic blending features detected.'
                : 'Our neural model has flags triggered for synthetic anomalies, indicating high probability of deep learning modifications.')
            }
          </p>
        </div>

        {/* Diagnostic Side-by-side comparison Grid */}
        {!isError && (
          <div className="comparison-grid">
            {/* Left Media Frame */}
            <div className="media-frame-wrapper">
              <div className="media-frame-title">
                <FileText size={16} style={{ color: '#00f2fe' }} />
                <span>Original Payload</span>
              </div>
              <div className={`media-frame ${isReal ? 'glow-real' : 'glow-fake'}`}>
                {isVideoFile(result.fileName) ? (
                  <video
                    src={`http://localhost:5000/uploads/${result.fileName}`}
                    controls
                    className="analysis-media"
                  />
                ) : (
                  <img
                    src={`http://localhost:5000/uploads/${result.fileName}`}
                    alt="Uploaded payload source"
                    className="analysis-media"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256';
                    }}
                  />
                )}
              </div>
            </div>

            {/* Right Heatmap Frame */}
            <div className="media-frame-wrapper">
              <div className="media-frame-title">
                <Activity size={16} style={{ color: '#00f2fe' }} />
                <span>AI Localization Map</span>
              </div>
              <div className={`media-frame ${isReal ? 'glow-real' : 'glow-fake'}`}>
                {result.heatmap ? (
                  <img
                    src={`data:image/png;base64,${result.heatmap}`}
                    alt="Deepfake localization anomalies map"
                    className="analysis-heatmap"
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--gray-500)', fontSize: '0.88rem' }}>
                    <ShieldAlert size={32} />
                    <span>Heatmap offline for real targets</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Confidence Dial Meter */}
        {!isError && (
          <div className="confidence-meter-container">
            <div className="confidence-header">
              <span className="confidence-title">Integrity Assurance Level</span>
              <span className={`confidence-percent ${isReal ? 'real' : 'fake'}`}>
                {result.confidence}% {isReal ? 'Authentic' : 'Manipulated'}
              </span>
            </div>
            <div className="confidence-meter">
              <div
                className={`confidence-fill ${isReal ? 'real' : 'fake'}`}
                style={{ width: `${result.confidence}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Diagnostics Table */}
        <div className="result-details" style={{ border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div className="result-item">
            <span className="result-label">Audited Specimen</span>
            <span className="result-value" style={{ maxWidth: '320px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {result.fileName}
            </span>
          </div>
          <div className="result-item">
            <span className="result-label">Prediction Verdict</span>
            <span className="result-value" style={{ color: isReal ? 'var(--success)' : 'var(--danger)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {result.prediction}
            </span>
          </div>
          <div className="result-item">
            <span className="result-label">Audit Timestamp</span>
            <span className="result-value" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <Calendar size={14} style={{ color: 'var(--primary)' }} />
              {result.processedAt ? new Date(result.processedAt).toLocaleString() : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {!isReal && !isError && (
        <div className="alert-banner-box" style={{ margin: '1.5rem 0' }}>
          <ShieldAlert size={20} />
          <span>
            <strong>CRITICAL WARNING:</strong> Forensic guards triggered! High pixel correlation anomalies found in facial boundary vectors. Verify identity check credentials offline.
          </span>
        </div>
      )}

      {error && (
        <div className="alert-banner-box" style={{ margin: '1rem 0' }}>
          <span><strong>Error:</strong> {error}</span>
        </div>
      )}

      {/* Grid actions controls */}
      <div className="dashboard-actions-grid">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="btn-professional-fluid primary"
        >
          {downloading ? (
            <>
              <span className="loading-spinner" style={{ borderTopColor: 'var(--black)' }}></span>
              Compiling PDF...
            </>
          ) : (
            <>
              <Download size={18} />
              Download Forensics Report
            </>
          )}
        </button>

        <button
          onClick={() => navigate('/')}
          className="btn-professional-fluid secondary"
        >
          <RotateCcw size={18} />
          Analyze Another Target
        </button>
      </div>
    </div>
  );
};

export default Report;
