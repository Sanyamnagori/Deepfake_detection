import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, FileVideo, FileImage, X, ShieldAlert } from 'lucide-react';
import { uploadFile } from '../api';

const Upload = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    validateAndSetFile(selectedFile);
  };

  const validateAndSetFile = (selectedFile) => {
    setError('');
    if (!selectedFile) return;

    const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'image/jpeg', 'image/png', 'image/jpg'];
    const maxSize = 200 * 1024 * 1024; // 200MB

    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Please select a valid video or image file (MP4, AVI, MOV, JPEG, PNG)');
      return;
    }

    if (selectedFile.size > maxSize) {
      setError('File size must be less than 200MB');
      return;
    }

    setFile(selectedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    validateAndSetFile(droppedFile);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);
    setError('');
    try {
      const response = await uploadFile(file, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      });
      navigate(`/detect/${response.data.uploadId}`);
    } catch (error) {
      console.error('Upload failed:', error);
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = () => {
    if (!file) return <UploadIcon className="upload-icon" size={60} />;
    return file.type.startsWith('video/') ? (
      <FileVideo size={56} style={{ color: '#00f2fe', filter: 'drop-shadow(0 0 8px rgba(0, 242, 254, 0.4))', marginBottom: '1.25rem' }} />
    ) : (
      <FileImage size={56} style={{ color: '#00f2fe', filter: 'drop-shadow(0 0 8px rgba(0, 242, 254, 0.4))', marginBottom: '1.25rem' }} />
    );
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="main-container">
      <div className="header" style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: '800', background: 'linear-gradient(120deg, #ffffff 40%, #00f2fe 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Secure Authentication Upload
        </h1>
        <p style={{ color: 'var(--gray-500)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
          Upload high-resolution media to initialize synthetic deepfake analysis scanning
        </p>
      </div>

      <div
        className={`upload-area ${dragOver ? 'dragover' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !file && fileInputRef.current?.click()}
        style={{ cursor: file ? 'default' : 'pointer' }}
      >
        {getFileIcon()}

        {!file ? (
          <>
            <div className="upload-text">Drop your secure media here or click to browse</div>
            <div className="upload-subtext">Supports MP4, AVI, MOV, JPEG, PNG (max 200MB)</div>
          </>
        ) : (
          <div style={{ width: '100%', maxWidth: '380px', margin: '0 auto' }}>
            <div className="result-details" style={{ marginTop: 0, marginBottom: '1.5rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div className="result-item" style={{ padding: '0.85rem 1.1rem' }}>
                <span className="result-label" style={{ fontSize: '0.85rem' }}>File Name</span>
                <span className="result-value" style={{ fontSize: '0.85rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.name}
                </span>
              </div>
              <div className="result-item" style={{ padding: '0.85rem 1.1rem' }}>
                <span className="result-label" style={{ fontSize: '0.85rem' }}>File Size</span>
                <span className="result-value" style={{ fontSize: '0.85rem' }}>
                  {formatFileSize(file.size)}
                </span>
              </div>
              <div className="result-item" style={{ padding: '0.85rem 1.1rem' }}>
                <span className="result-label" style={{ fontSize: '0.85rem' }}>File Type</span>
                <span className="result-value" style={{ fontSize: '0.85rem', textTransform: 'uppercase' }}>
                  {file.type.split('/')[1]}
                </span>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                removeFile();
              }}
              className="btn-professional btn-secondary"
              style={{
                padding: '0.65rem 1.5rem',
                fontSize: '0.88rem',
                borderRadius: 'var(--radius-md)',
                display: 'inline-flex',
                gap: '0.4rem',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#ef4444'
              }}
            >
              <X size={16} />
              Reset Selection
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="video/*,image/*"
          onChange={handleFileChange}
          className="file-input"
        />
      </div>

      {error && (
        <div className="alert-banner-box" style={{ margin: '1.25rem 0' }}>
          <ShieldAlert size={18} />
          <span><strong>Error:</strong> {error}</span>
        </div>
      )}

      {uploading && (
        <div className="progress-container" style={{ marginTop: '1.5rem', background: 'rgba(15, 23, 42, 0.6)' }}>
          <div className="progress-bar-wrapper">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <div className="progress-text" style={{ color: 'var(--gray-700)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="loading-spinner" style={{ width: '12px', height: '12px', margin: 0, borderWidth: '1.5px' }}></span>
              Uploading payload to AI nodes...
            </span>
            <span style={{ color: '#00f2fe' }}>{uploadProgress}%</span>
          </div>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="btn-professional"
        style={{ width: '100%', marginTop: '1.5rem', borderRadius: 'var(--radius-md)', padding: '1rem' }}
      >
        {uploading ? (
          <>
            <span className="loading-spinner" style={{ borderTopColor: 'var(--black)' }}></span>
            Initializing Scan...
          </>
        ) : (
          'Upload & Run AI Analysis'
        )}
      </button>
    </div>
  );
};

export default Upload;
