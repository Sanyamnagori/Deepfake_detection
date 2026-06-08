import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Brain, Terminal, Cpu, Layers } from 'lucide-react';
import { detectDeepfake, BACKEND_ORIGIN } from '../api';

const Detect = ({ uploadId }) => {
  const navigate = useNavigate();
  const { uploadId: paramUploadId } = useParams();
  const currentUploadId = uploadId || paramUploadId;
  
  const [detecting, setDetecting] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState({ progress: 0, currentFrame: 0, totalFrames: 0 });
  const [error, setError] = useState('');
  const [logs, setLogs] = useState([]);
  
  const logsEndRef = useRef(null);

  // Auto-scroll the terminal logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // WebSocket progress logic
  useEffect(() => {
    let ws;
    if (detecting && currentUploadId) {
      const wsProtocol = BACKEND_ORIGIN.startsWith('https') ? 'wss' : 'ws';
      const wsHost = BACKEND_ORIGIN.replace(/^https?:\/\//, '');
      ws = new WebSocket(`${wsProtocol}://${wsHost}?uploadId=${currentUploadId}`);
      
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

  // Generate automated cyber logs based on progress values
  useEffect(() => {
    if (!detecting) return;
    const progress = analysisProgress.progress;
    const newLogs = [];

    const formatTime = () => new Date().toLocaleTimeString();

    if (progress >= 0 && logs.length === 0) {
      newLogs.push(`[${formatTime()}] SYS_HANDSHAKE: Establishing secure connection to FastAPI server...`);
    }
    if (progress >= 5 && !logs.some(l => l.includes('PORT_8000'))) {
      newLogs.push(`[${formatTime()}] SECURE_PORT: Tunnel open on port 8000. Verification initialized.`);
    }
    if (progress >= 10 && !logs.some(l => l.includes('GUARD_ACTIVE'))) {
      newLogs.push(`[${formatTime()}] GUARD_ACTIVE: Skipping double-cropping Haar cascade guards (Resolution confirmed).`);
    }
    if (progress >= 20 && !logs.some(l => l.includes('EXTRACTOR'))) {
      newLogs.push(`[${formatTime()}] EXTRACTOR: Isolating spatial face coordinates. Lock status: ACTIVE.`);
    }
    if (progress >= 40 && !logs.some(l => l.includes('CONVOLUTION'))) {
      newLogs.push(`[${formatTime()}] CONVOLUTION: Initializing EfficientNet high-accuracy network layers...`);
    }
    if (progress >= 60 && !logs.some(l => l.includes('TRACKING_ANOMALY'))) {
      newLogs.push(`[${formatTime()}] TRACKING_ANOMALY: Running classification weights check (P(real) threshold calibrated).`);
    }
    if (progress >= 80 && !logs.some(l => l.includes('HEATMAP_COMPILING'))) {
      newLogs.push(`[${formatTime()}] HEATMAP_COMPILING: Plotting neural activation matrices for face localization map...`);
    }
    if (progress >= 95 && !logs.some(l => l.includes('SYNCING_MONGO'))) {
      newLogs.push(`[${formatTime()}] SYNCING_MONGO: Analysis locked. Generating reports & updating MongoDB Atlas...`);
    }

    if (newLogs.length > 0) {
      setLogs(prev => [...prev, ...newLogs]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysisProgress.progress, detecting]);

  const handleDetect = async () => {
    setDetecting(true);
    setAnalysisProgress({ progress: 0, currentFrame: 0, totalFrames: 0 });
    setLogs([`[${new Date().toLocaleTimeString()}] COMMAND_INIT: Executing deepfake diagnostic model...`]);
    setError('');
    try {
      const response = await detectDeepfake(currentUploadId);
      navigate(`/report/${response.data.resultId}`);
    } catch (error) {
      console.error('Detection failed:', error);
      setError('Detection failed. Please check backend connection and try again.');
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ERROR: Diagnostics crashed. Status code 500.`]);
    } finally {
      setDetecting(false);
    }
  };

  return (
    <div className="main-container">
      <div className="header" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: '800', background: 'linear-gradient(120deg, #ffffff 40%, #00f2fe 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          AI Diagnostics Control Panel
        </h1>
        <p style={{ color: 'var(--gray-500)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
          Initialize computer vision analysis to analyze facial alignments and spatial noise discrepancies
        </p>
      </div>

      <div className="result-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
        {/* Holographic Pulse Radar */}
        <div className="radar-pulse-container">
          <div className="radar-circle"></div>
          <div className="radar-circle"></div>
          <div className="radar-circle"></div>
          <div className="radar-scanner-sweeper"></div>
          <div className="radar-core">
            <Brain size={42} />
          </div>
        </div>

        <p style={{ color: 'var(--gray-600)', margin: '0 0 1.5rem 0', fontSize: '0.98rem', maxWidth: '520px', lineHeight: '1.7', textAlign: 'center' }}>
          Our neural network processes the media frames sequentially. It detects micro-texture manipulations and facial blending anomalies with sub-millimeter diagnostic precision.
        </p>
        
        <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)', background: 'rgba(255, 255, 255, 0.02)', padding: '0.5rem 1.25rem', borderRadius: 'var(--radius-full)', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <Cpu size={14} style={{ color: '#00f2fe' }} />
          Session Payload ID: <span style={{ fontWeight: '700', color: 'var(--white)', fontFamily: 'monospace' }}>{currentUploadId}</span>
        </div>
      </div>

      {detecting && (
        <div className="progress-container" style={{ marginBottom: '2.5rem', background: 'rgba(15, 23, 42, 0.6)' }}>
          <div className="progress-bar-wrapper">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${analysisProgress.progress}%` }}
            ></div>
          </div>
          <div className="progress-text" style={{ color: 'var(--gray-700)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={16} style={{ color: '#00f2fe' }} />
              <span>Scanning keyframes...</span>
            </div>
            <span style={{ color: '#00f2fe' }}>{analysisProgress.progress}%</span>
          </div>
          {analysisProgress.totalFrames > 0 && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--gray-500)', textAlign: 'center', fontWeight: '500' }}>
              Extracted {analysisProgress.currentFrame} of {analysisProgress.totalFrames} diagnostic visual units
            </div>
          )}
        </div>
      )}

      {/* Futuristic Command Logs Terminal */}
      {logs.length > 0 && (
        <div className="terminal-logs">
          {logs.map((log, idx) => (
            <div key={idx} className="terminal-log-line">
              <span className="terminal-log-prefix">&gt;</span>
              <span>{log}</span>
            </div>
          ))}
          {detecting && (
            <div className="terminal-log-line">
              <span className="terminal-log-prefix">&gt;</span>
              <span>Scanning database index...</span>
              <span className="terminal-cursor"></span>
            </div>
          )}
          <div ref={logsEndRef} />
        </div>
      )}

      {error && (
        <div className="alert-banner-box" style={{ marginBottom: '1.5rem' }}>
          <span><strong>Error:</strong> {error}</span>
        </div>
      )}

      <button
        onClick={handleDetect}
        disabled={detecting}
        className="btn-professional"
        style={{ width: '100%', borderRadius: 'var(--radius-md)', padding: '1.1rem' }}
      >
        {detecting ? (
          <>
            <span className="loading-spinner" style={{ borderTopColor: 'var(--black)' }}></span>
            Executing Neural Diagnostics...
          </>
        ) : (
          <>
            <Terminal size={18} style={{ marginRight: '0.25rem' }} />
            Initialize AI Analysis Scan
          </>
        )}
      </button>
    </div>
  );
};

export default Detect;
