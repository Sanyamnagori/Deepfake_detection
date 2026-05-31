import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, FileVideo, FileImage, ShieldAlert, Cpu, Activity, Clock, Award, ShieldCheck, ChevronRight, Zap, Lock } from 'lucide-react';
import { uploadFile, compareModels } from '../api';

const BattleArena = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Auth Guard Role Validation
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.role === 'admin') {
          setIsAdmin(true);
          return;
        }
      }
    } catch (e) {
      console.error('Error parsing user session:', e);
    }
    // Redirect to home if not admin
    setIsAdmin(false);
  }, []);

  // Upload States
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [scanStep, setScanStep] = useState('');
  
  // Results Telemetry
  const [comparativeData, setComparativeData] = useState(null);
  const [error, setError] = useState('');

  const onDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const onDragLeave = () => {
    setDragOver(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    validateAndSetFile(droppedFile);
  };

  const onFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    validateAndSetFile(selectedFile);
  };

  const validateAndSetFile = (file) => {
    if (!file) return;
    const allowedTypes = ['video/mp4', 'video/quicktime', 'image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.type)) {
      setFile(file);
      setError('');
      setComparativeData(null);
    } else {
      setError('Unrecognized specimen. Upload MP4, MOV, JPEG or PNG formats only.');
    }
  };

  const handleUploadAndAnalyze = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    setError('');
    
    try {
      // 1. Upload File
      const uploadRes = await uploadFile(file, (event) => {
        const percent = Math.round((event.loaded * 100) / event.total);
        setProgress(percent);
      });
      
      setUploading(false);
      setAnalyzing(true);
      
      // 2. Perform parallel comparison inference
      const steps = [
        'Connecting to neural pipeline hubs...',
        'Seeding EfficientNet-B4 texture weights...',
        'Spanning MesoNet-4 frame analyzer channels...',
        'Calculating RGB channel gradient correlations...',
        'Extracting attentional focus heatmaps...'
      ];
      
      let stepIndex = 0;
      setScanStep(steps[0]);
      const interval = setInterval(() => {
        stepIndex++;
        if (stepIndex < steps.length) {
          setScanStep(steps[stepIndex]);
        }
      }, 900);
      
      const compareRes = await compareModels(uploadRes.data.uploadId);
      
      clearInterval(interval);
      setComparativeData(compareRes.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Dual-inference diagnostics crashed.');
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const resetArena = () => {
    setFile(null);
    setComparativeData(null);
    setError('');
    setProgress(0);
  };



  if (!isAdmin) {
    return (
      <div className="main-container" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
        <Lock size={56} style={{ color: 'var(--danger)', marginBottom: '1.5rem', filter: 'drop-shadow(0 0 10px var(--danger-glow))' }} />
        <h2 style={{ color: 'var(--gray-900)', fontWeight: '800', fontSize: '1.8rem', marginBottom: '1rem' }}>
          Access Privilege Level Restricted
        </h2>
        <p style={{ color: 'var(--gray-500)', maxWidth: '550px', margin: '0 auto 2.5rem', lineHeight: '1.7' }}>
          The Multi-Model Battle Arena is an advanced diagnostic utility restricted exclusively to security administrators. Please log in with admin-level credentials to gain access.
        </p>
        <button onClick={() => navigate('/login')} className="btn-professional" style={{ padding: '0.85rem 2.5rem', borderRadius: 'var(--radius-md)' }}>
          Sign In as Administrator
        </button>
      </div>
    );
  }

  return (
    <div className="main-container" style={{ maxWidth: '1200px' }}>
      
      {/* Header Banner */}
      <div className="header" style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'inline-flex', padding: '0.4rem 1rem', background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.2)', borderRadius: '9999px', color: 'var(--accent)', fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem', alignItems: 'center', gap: '0.4rem' }}>
          <Cpu size={14} />
          Admin Battle Arena Active
        </div>
        <h1 style={{ fontSize: '1.9rem', fontWeight: '800', background: 'linear-gradient(120deg, var(--gray-900) 40%, var(--accent) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Neural Engine Comparison Matrix
        </h1>
        <p style={{ color: 'var(--gray-500)', fontSize: '0.95rem', marginTop: '0.35rem' }}>
          Run high-accuracy diagnostic sweeps simultaneously through distinct deep learning architectures.
        </p>
      </div>

      {/* Upload dropzone deck */}
      {!file && !uploading && !analyzing && (
        <div 
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current.click()}
          className="upload-dropzone"
          style={{ 
            padding: '4.5rem 2rem', 
            borderRadius: 'var(--radius-lg)', 
            border: dragOver ? '2px dashed var(--accent)' : '2px dashed var(--card-border)',
            background: dragOver ? 'rgba(168, 85, 247, 0.04)' : 'var(--card-bg)',
            boxShadow: dragOver ? '0 0 25px rgba(168, 85, 247, 0.15)' : 'var(--shadow-md)',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all var(--transition-base)'
          }}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={onFileSelect} 
            style={{ display: 'none' }} 
            accept="image/*,video/*"
          />
          <div className="upload-icon-wrapper" style={{ display: 'inline-flex', padding: '1.25rem', background: dragOver ? 'rgba(168, 85, 247, 0.08)' : 'rgba(255,255,255,0.03)', border: dragOver ? '1px solid rgba(168, 85, 247, 0.2)' : '1px solid var(--card-border)', borderRadius: 'var(--radius-xl)', marginBottom: '1.5rem', color: dragOver ? 'var(--accent)' : 'var(--gray-500)', transition: 'all var(--transition-base)' }}>
            <UploadCloud size={44} className={dragOver ? 'animate-bounce' : ''} />
          </div>
          <h3 style={{ color: 'var(--gray-900)', fontWeight: '800', fontSize: '1.35rem', marginBottom: '0.5rem' }}>
            Load Specimen to Battle Arena
          </h3>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.95rem', maxWidth: '480px', margin: '0 auto' }}>
            Drag and drop target MP4, MOV, JPEG, or PNG files, or click here to browse administrator storage directories.
          </p>
        </div>
      )}

      {/* Selected file loading card */}
      {file && !comparativeData && (
        <div className="result-card" style={{ padding: '2rem 1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '0.85rem', background: 'var(--input-bg)', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)', color: 'var(--accent)' }}>
                {file.type.startsWith('video') ? <FileVideo size={28} /> : <FileImage size={28} />}
              </div>
              <div>
                <h4 style={{ color: 'var(--gray-900)', fontWeight: '800', fontSize: '1.05rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.name}
                </h4>
                <p style={{ color: 'var(--gray-500)', fontSize: '0.85rem' }}>
                  Size: {(file.size / (1024 * 1024)).toFixed(2)} MB &bull; Ready for dual inference
                </p>
              </div>
            </div>

            {!uploading && !analyzing ? (
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={resetArena} className="btn-professional" style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)', color: 'var(--gray-700)', padding: '0.7rem 1.25rem' }}>
                  Reset Target
                </button>
                <button onClick={handleUploadAndAnalyze} className="btn-professional" style={{ background: 'var(--accent)', color: 'var(--white)', padding: '0.7rem 1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  Engage Battle Arena
                  <ChevronRight size={16} />
                </button>
              </div>
            ) : null}
          </div>

          {/* Upload progress indicator */}
          {uploading && (
            <div style={{ marginTop: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--gray-500)' }}>Uploading payload to cyber node...</span>
                <span style={{ color: 'var(--accent)' }}>{progress}%</span>
              </div>
              <div className="confidence-meter" style={{ height: '6px', background: 'var(--gray-200)', borderRadius: '9999px' }}>
                <div className="confidence-fill" style={{ width: `${progress}%`, height: '100%', background: 'var(--accent)', borderRadius: '9999px' }}></div>
              </div>
            </div>
          )}

          {/* Deep learning analysis scans simulation indicator */}
          {analyzing && (
            <div style={{ marginTop: '2rem', textAlign: 'center', padding: '1rem 0' }}>
              <div className="loading-spinner" style={{ width: '40px', height: '40px', margin: '0 auto 1.25rem', borderWidth: '3px', borderTopColor: 'var(--accent)' }}></div>
              <h4 style={{ color: 'var(--gray-900)', fontWeight: '800', fontSize: '1.05rem', marginBottom: '0.35rem' }}>
                Conducting Parallel Scan Audits...
              </h4>
              <p style={{ color: 'var(--accent)', fontSize: '0.88rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05rem' }}>
                {scanStep}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error alert banner */}
      {error && (
        <div className="result-card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--danger)', marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <ShieldAlert size={24} style={{ color: 'var(--danger)' }} />
          <span style={{ color: 'var(--gray-800)', fontWeight: '600', fontSize: '0.92rem' }}>{error}</span>
        </div>
      )}

      {/* COMPARATIVE TELEMETRY SCREEN */}
      {comparativeData && (
        <div style={{ animation: 'pageFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}>
          
          {/* Quick Metrics Bar (Latency Benchmarks) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            
            {/* Speed Benchmark card */}
            <div className="result-card" style={{ margin: 0, padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.08)', borderRadius: 'var(--radius-md)', color: 'var(--success)' }}>
                <Zap size={24} />
              </div>
              <div>
                <h5 style={{ color: 'var(--gray-500)', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.02rem' }}>
                  Execution Speed Winner
                </h5>
                <h4 style={{ color: 'var(--gray-900)', fontWeight: '800', fontSize: '1.2rem', marginTop: '0.15rem' }}>
                  MesoNet-4 is {Math.round(comparativeData.efficientnet.latency / comparativeData.mesonet.latency)}x Faster!
                </h4>
              </div>
            </div>

            {/* Verdict Alignment status */}
            <div className="result-card" style={{ margin: 0, padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ padding: '0.75rem', background: comparativeData.efficientnet.prediction === comparativeData.mesonet.prediction ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)', borderRadius: 'var(--radius-md)', color: comparativeData.efficientnet.prediction === comparativeData.mesonet.prediction ? 'var(--success)' : 'var(--danger)' }}>
                {comparativeData.efficientnet.prediction === comparativeData.mesonet.prediction ? <ShieldCheck size={24} /> : <ShieldAlert size={24} />}
              </div>
              <div>
                <h5 style={{ color: 'var(--gray-500)', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.02rem' }}>
                  Pipeline Agreement State
                </h5>
                <h4 style={{ color: 'var(--gray-900)', fontWeight: '800', fontSize: '1.2rem', marginTop: '0.15rem' }}>
                  {comparativeData.efficientnet.prediction === comparativeData.mesonet.prediction 
                    ? '100% Verdict Alignment' 
                    : 'Disputed Neural Predictions'}
                </h4>
              </div>
            </div>

          </div>

          {/* DUAL COMPARATIVE SCREEN COCKPIT */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
            
            {/* COLUMN 1: EFFICIENTNET PIPELINE */}
            <div className="result-card" style={{ margin: 0, padding: '2rem 1.75rem', borderTop: '4px solid var(--accent)' }}>
              
              {/* Header spec */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.50rem' }}>
                  <Cpu size={20} style={{ color: 'var(--accent)' }} />
                  <span style={{ fontWeight: '800', fontSize: '1.05rem', color: 'var(--gray-900)' }}>EfficientNet-B4</span>
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--accent)', background: 'rgba(168, 85, 247, 0.06)', border: '1px solid rgba(168, 85, 247, 0.15)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-sm)' }}>
                  Core Classifier
                </span>
              </div>

              {/* Verdict Indicator */}
              <div style={{ textAlign: 'center', padding: '1.25rem 0', background: 'var(--input-bg)', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--gray-500)', letterSpacing: '0.04em' }}>Verdict Decision</span>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginTop: '0.25rem', color: comparativeData.efficientnet.prediction === 'real' ? 'var(--success)' : 'var(--danger)' }}>
                  {comparativeData.efficientnet.prediction === 'real' ? 'Verified Authentic' : 'Synthetic Media Detected'}
                </h3>
              </div>

              {/* Attentional Focus Heatmap Frame */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--gray-700)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Activity size={14} style={{ color: 'var(--accent)' }} />
                  Attentional Focus Map
                </span>
                <div className="media-frame" style={{ maxWidth: '100%', maxHeight: '220px', aspectRatio: '16/10', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--card-border)', overflow: 'hidden', background: '#020617', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  {comparativeData.efficientnet.heatmap ? (
                    <img 
                      src={`data:image/png;base64,${comparativeData.efficientnet.heatmap}`} 
                      alt="EfficientNet focus map" 
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <div style={{ color: 'var(--gray-500)', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <ShieldAlert size={28} />
                      <span>Heatmap offline</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Confidence dial and speed telemetry details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Confidence Bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.4rem' }}>
                    <span style={{ color: 'var(--gray-500)' }}>Confidence Rating</span>
                    <span style={{ color: comparativeData.efficientnet.prediction === 'real' ? 'var(--success)' : 'var(--danger)' }}>
                      {Math.round(comparativeData.efficientnet.confidence * 100)}%
                    </span>
                  </div>
                  <div className="confidence-meter" style={{ height: '6px', background: 'var(--gray-200)', borderRadius: '9999px' }}>
                    <div className={`confidence-fill ${comparativeData.efficientnet.prediction === 'real' ? 'real' : 'fake'}`} style={{ width: `${Math.round(comparativeData.efficientnet.confidence * 100)}%`, height: '100%', borderRadius: '9999px' }}></div>
                  </div>
                </div>

                {/* Latency Speed */}
                <div style={{ display: 'flex', justify: 'between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--input-bg)', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)', fontSize: '0.88rem' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--gray-500)', fontWeight: '600' }}>
                    <Clock size={14} />
                    Inference Latency
                  </div>
                  <span style={{ color: 'var(--gray-900)', fontWeight: '800' }}>
                    {comparativeData.efficientnet.latency} ms
                  </span>
                </div>
              </div>

            </div>

            {/* COLUMN 2: MESONET PIPELINE */}
            <div className="result-card" style={{ margin: 0, padding: '2rem 1.75rem', borderTop: '4px solid var(--primary)' }}>
              
              {/* Header spec */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.50rem' }}>
                  <Cpu size={20} style={{ color: 'var(--primary)' }} />
                  <span style={{ fontWeight: '800', fontSize: '1.05rem', color: 'var(--gray-900)' }}>MesoNet-4</span>
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--primary)', background: 'rgba(0, 242, 254, 0.06)', border: '1px solid rgba(0, 242, 254, 0.15)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-sm)' }}>
                  Gradient Classifier
                </span>
              </div>

              {/* Verdict Indicator */}
              <div style={{ textAlign: 'center', padding: '1.25rem 0', background: 'var(--input-bg)', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--gray-500)', letterSpacing: '0.04em' }}>Verdict Decision</span>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginTop: '0.25rem', color: comparativeData.mesonet.prediction === 'real' ? 'var(--success)' : 'var(--danger)' }}>
                  {comparativeData.mesonet.prediction === 'real' ? 'Verified Authentic' : 'Synthetic Media Detected'}
                </h3>
              </div>

              {/* Attentional Focus Heatmap Frame */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--gray-700)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Activity size={14} style={{ color: 'var(--primary)' }} />
                  Attentional Focus Map
                </span>
                <div className="media-frame" style={{ maxWidth: '100%', maxHeight: '220px', aspectRatio: '16/10', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--card-border)', overflow: 'hidden', background: '#020617', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  {comparativeData.mesonet.heatmap ? (
                    <img 
                      src={`data:image/png;base64,${comparativeData.mesonet.heatmap}`} 
                      alt="MesoNet focus map" 
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <div style={{ color: 'var(--gray-500)', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <ShieldAlert size={28} />
                      <span>Heatmap offline</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Confidence dial and speed telemetry details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Confidence Bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.4rem' }}>
                    <span style={{ color: 'var(--gray-500)' }}>Confidence Rating</span>
                    <span style={{ color: comparativeData.mesonet.prediction === 'real' ? 'var(--success)' : 'var(--danger)' }}>
                      {Math.round(comparativeData.mesonet.confidence * 100)}%
                    </span>
                  </div>
                  <div className="confidence-meter" style={{ height: '6px', background: 'var(--gray-200)', borderRadius: '9999px' }}>
                    <div className={`confidence-fill ${comparativeData.mesonet.prediction === 'real' ? 'real' : 'fake'}`} style={{ width: `${Math.round(comparativeData.mesonet.confidence * 100)}%`, height: '100%', borderRadius: '9999px' }}></div>
                  </div>
                </div>

                {/* Latency Speed */}
                <div style={{ display: 'flex', justify: 'between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--input-bg)', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)', fontSize: '0.88rem' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--gray-500)', fontWeight: '600' }}>
                    <Clock size={14} />
                    Inference Latency
                  </div>
                  <span style={{ color: 'var(--gray-900)', fontWeight: '800' }}>
                    {comparativeData.mesonet.latency} ms
                  </span>
                </div>
              </div>

            </div>

          </div>

          {/* Battle Arena action controls */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button onClick={resetArena} className="btn-professional" style={{ flex: 1, minWidth: '180px', padding: '0.85rem 2rem', borderRadius: 'var(--radius-md)', background: 'var(--input-bg)', border: '1px solid var(--card-border)', color: 'var(--gray-800)', fontWeight: '700' }}>
              Compare Another Specimen
            </button>
            <button onClick={() => navigate('/archive')} className="btn-professional" style={{ flex: 1, minWidth: '180px', padding: '0.85rem 2rem', borderRadius: 'var(--radius-md)', background: 'var(--accent)', color: 'var(--white)', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
              <Award size={18} />
              Open Audit Archives
            </button>
          </div>

        </div>
      )}

    </div>
  );
};

export default BattleArena;
