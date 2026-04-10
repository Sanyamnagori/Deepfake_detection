import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, FileVideo, FileImage, X } from 'lucide-react';
import { uploadFile } from '../api';

const Upload = ({ onUpload }) => {
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
    const maxSize = 200 * 1024 * 1024; // Increased to 200MB

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
    if (!file) return <UploadIcon className="upload-icon" />;
    return file.type.startsWith('video/') ? <FileVideo size={48} /> : <FileImage size={48} />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem', color: '#1e293b', fontSize: '1.5rem', fontWeight: '600' }}>
        Upload Media File
      </h2>

      <div
        className={`upload-area ${dragOver ? 'dragover' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        {getFileIcon()}

        {!file ? (
          <>
            <div className="upload-text">Drop your file here or click to browse</div>
            <div className="upload-subtext">Supports MP4, AVI, MOV, JPEG, PNG (max 100MB)</div>
          </>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: '600', color: '#1e293b', marginBottom: '0.5rem' }}>
              {file.name}
            </div>
            <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>
              {formatFileSize(file.size)}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeFile();
              }}
              className="btn danger"
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                fontSize: '0.9rem',
                minWidth: 'auto'
              }}
            >
              <X size={16} style={{ marginRight: '0.25rem' }} />
              Remove
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

      {error && <div className="error-message">{error}</div>}

      {uploading && (
        <div className="progress-container">
          <div className="progress-bar-wrapper">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <div className="progress-text">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="btn"
        style={{ width: '100%', marginTop: '1rem' }}
      >
        {uploading && <span className="loading-spinner"></span>}
        {uploading ? 'Uploading...' : 'Upload & Analyze'}
      </button>
    </div>
  );
};

export default Upload;
