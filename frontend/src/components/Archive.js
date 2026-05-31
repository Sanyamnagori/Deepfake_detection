import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShieldAlert, CheckCircle2, AlertOctagon, Calendar, Download, Eye, RefreshCw, UploadCloud } from 'lucide-react';
import { getResultsHistory, downloadReport } from '../api';

const Archive = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [verdictFilter, setVerdictFilter] = useState('all'); // 'all', 'real', 'fake'
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest', 'oldest', 'confidence'

  const fetchHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getResultsHistory();
      setHistory(response.data);
      setFilteredHistory(response.data);
    } catch (err) {
      console.error('Error fetching history:', err);
      setError('Failed to retrieve database forensics logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Handle Search and Filters combined
  useEffect(() => {
    let result = [...history];

    // Filter by Search Query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => 
        (item.originalName && item.originalName.toLowerCase().includes(query)) ||
        (item.fileName && item.fileName.toLowerCase().includes(query)) ||
        item._id.toLowerCase().includes(query)
      );
    }

    // Filter by Verdict
    if (verdictFilter !== 'all') {
      result = result.filter(item => item.prediction === verdictFilter);
    }

    // Sort Results
    result.sort((a, b) => {
      if (sortOrder === 'newest') {
        return new Date(b.processedAt) - new Date(a.processedAt);
      }
      if (sortOrder === 'oldest') {
        return new Date(a.processedAt) - new Date(b.processedAt);
      }
      if (sortOrder === 'confidence') {
        return b.confidence - a.confidence;
      }
      return 0;
    });

    setFilteredHistory(result);
  }, [searchQuery, verdictFilter, sortOrder, history]);

  const handleDownload = async (e, resultId) => {
    e.stopPropagation(); // Avoid navigating to report page on card click
    setDownloadingId(resultId);
    try {
      const response = await downloadReport(resultId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `deepfake_report_${resultId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Download report failed:', err);
      alert('Failed to compile PDF report.');
    } finally {
      setDownloadingId(null);
    }
  };

  const isVideoFile = (fileName) => {
    if (!fileName) return false;
    const ext = fileName.split('.').pop().toLowerCase();
    return ['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(ext);
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="main-container" style={{ maxWidth: '1200px' }}>
      {/* Header */}
      <div className="header" style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.9rem', fontWeight: '800', background: 'linear-gradient(120deg, var(--gray-900) 40%, var(--primary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Cyber-Forensics Scan Archive
          </h1>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.95rem', marginTop: '0.35rem' }}>
            Central repository of all historical media integrity and authenticity audits.
          </p>
        </div>
        <button 
          onClick={fetchHistory} 
          className="btn-professional" 
          style={{ padding: '0.65rem 1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', borderRadius: 'var(--radius-md)', background: 'var(--input-bg)', border: '1px solid var(--card-border)', color: 'var(--gray-700)' }}
          aria-label="Refresh scanning log history"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Reload Archive
        </button>
      </div>

      {/* Control Panel: Search & Filters */}
      <div className="result-card" style={{ padding: '1.25rem 1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          
          {/* Search bar */}
          <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '1.1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
            <input
              type="text"
              placeholder="Search by file name or audit ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-input"
              style={{ paddingLeft: '2.8rem', width: '100%', margin: 0, borderRadius: 'var(--radius-md)' }}
            />
          </div>

          {/* Verdict Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--input-bg)', padding: '0.3rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--input-border)' }}>
            <button
              onClick={() => setVerdictFilter('all')}
              style={{ padding: '0.45rem 1rem', border: 'none', background: verdictFilter === 'all' ? 'var(--card-bg)' : 'transparent', color: verdictFilter === 'all' ? 'var(--primary)' : 'var(--gray-500)', fontWeight: '600', fontSize: '0.85rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'all var(--transition-fast)' }}
            >
              All Audits
            </button>
            <button
              onClick={() => setVerdictFilter('real')}
              style={{ padding: '0.45rem 1rem', border: 'none', background: verdictFilter === 'real' ? 'var(--card-bg)' : 'transparent', color: verdictFilter === 'real' ? 'var(--success)' : 'var(--gray-500)', fontWeight: '600', fontSize: '0.85rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'all var(--transition-fast)' }}
            >
              Authentic
            </button>
            <button
              onClick={() => setVerdictFilter('fake')}
              style={{ padding: '0.45rem 1rem', border: 'none', background: verdictFilter === 'fake' ? 'var(--card-bg)' : 'transparent', color: verdictFilter === 'fake' ? 'var(--danger)' : 'var(--gray-500)', fontWeight: '600', fontSize: '0.85rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'all var(--transition-fast)' }}
            >
              Manipulated
            </button>
          </div>

          {/* Sorting Option */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--gray-500)' }}>Sort:</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="text-input"
              style={{ margin: 0, padding: '0.45rem 2rem 0.45rem 1rem', fontSize: '0.85rem', width: 'auto', borderRadius: 'var(--radius-md)' }}
            >
              <option value="newest">Newest Scans</option>
              <option value="oldest">Oldest Scans</option>
              <option value="confidence">Highest Flags</option>
            </select>
          </div>

        </div>
      </div>

      {/* Grid Content / Loading & Error Handling */}
      {loading ? (
        <div className="result-card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <div className="loading-spinner" style={{ width: '40px', height: '40px', margin: '0 auto 1.5rem', borderWidth: '3px', borderTopColor: 'var(--primary)' }}></div>
          <p style={{ color: 'var(--gray-500)', fontWeight: '600' }}>Decrypting archived forensics ledger...</p>
        </div>
      ) : error ? (
        <div className="result-card" style={{ padding: '3rem 2rem', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
          <ShieldAlert size={44} style={{ color: 'var(--danger)', marginBottom: '1.5rem' }} />
          <h3 style={{ color: 'var(--gray-900)', fontWeight: '800', marginBottom: '0.5rem' }}>Database Retrieval Error</h3>
          <p style={{ color: 'var(--gray-500)', marginBottom: '2rem' }}>{error}</p>
          <button onClick={fetchHistory} className="btn-professional">Retry Loading</button>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="result-card" style={{ padding: '5rem 2rem', textAlign: 'center' }}>
          <UploadCloud size={56} style={{ color: 'var(--primary)', opacity: 0.6, marginBottom: '1.5rem' }} />
          <h3 style={{ color: 'var(--gray-900)', fontWeight: '800', fontSize: '1.4rem', marginBottom: '0.5rem' }}>
            No Scan Specimen Found
          </h3>
          <p style={{ color: 'var(--gray-500)', maxWidth: '500px', margin: '0 auto 2rem', fontSize: '0.95rem', lineHeight: '1.6' }}>
            {history.length === 0
              ? "You haven't conducted any deepfake forensics scans yet. Upload your first target payload to initiate verification audits."
              : "No records matched your specific filter query. Reset your search details to reload general listings."}
          </p>
          {history.length === 0 ? (
            <button onClick={() => navigate('/upload')} className="btn-professional">
              Initiate Diagnostic Scan
            </button>
          ) : (
            <button onClick={() => { setSearchQuery(''); setVerdictFilter('all'); }} className="btn-professional" style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)', color: 'var(--gray-700)' }}>
              Reset Search Filters
            </button>
          )}
        </div>
      ) : (
        /* History Grid */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
          {filteredHistory.map((item) => {
            const isReal = item.prediction === 'real';
            const isError = item.prediction === 'error';
            return (
              <div 
                key={item._id}
                onClick={() => navigate(`/report/${item._id}`)}
                className="result-card"
                style={{ 
                  margin: 0, 
                  padding: '1.5rem', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  borderLeft: isError ? '4px solid var(--gray-400)' : (isReal ? '4px solid var(--success)' : '4px solid var(--danger)'),
                  transition: 'all var(--transition-base)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-glow)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                }}
              >
                <div>
                  {/* Card top details */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                    <div style={{ display: 'inline-flex', padding: '0.5rem', background: isReal ? 'rgba(16, 185, 129, 0.04)' : 'rgba(239, 68, 68, 0.04)', border: isReal ? '1px solid rgba(16, 185, 129, 0.1)' : '1px solid rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-md)' }}>
                      {isReal ? (
                        <CheckCircle2 size={24} style={{ color: 'var(--success)' }} />
                      ) : (
                        <AlertOctagon size={24} style={{ color: 'var(--danger)' }} />
                      )}
                    </div>
                    <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--gray-400)', background: 'var(--input-bg)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)' }}>
                      ID: {item._id.substring(0, 8)}...
                    </span>
                  </div>

                  {/* Specimen File Name */}
                  <h4 style={{ color: 'var(--gray-900)', fontWeight: '800', fontSize: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '0.4rem' }}>
                    {item.originalName || item.fileName}
                  </h4>

                  {/* Date & Metadata specs */}
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.78rem', color: 'var(--gray-500)', marginBottom: '1.25rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Calendar size={12} />
                      {new Date(item.processedAt).toLocaleDateString()}
                    </span>
                    <span>&bull;</span>
                    <span>{formatBytes(item.size)}</span>
                    <span>&bull;</span>
                    <span style={{ textTransform: 'uppercase', fontWeight: '700' }}>
                      {isVideoFile(item.originalName || item.fileName) ? 'Video' : 'Image'}
                    </span>
                  </div>
                </div>

                {/* Rating Gauge and Action bar */}
                <div>
                  {/* Gauge */}
                  {!isError && (
                    <div style={{ marginBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.35rem' }}>
                        <span style={{ color: 'var(--gray-500)' }}>Integrity Level</span>
                        <span style={{ color: isReal ? 'var(--success)' : 'var(--danger)' }}>
                          {item.confidence}% {isReal ? 'Real' : 'Fake'}
                        </span>
                      </div>
                      <div className="confidence-meter" style={{ height: '5px', background: 'var(--gray-200)', borderRadius: 'var(--radius-full)' }}>
                        <div 
                          className={`confidence-fill ${isReal ? 'real' : 'fake'}`} 
                          style={{ width: `${item.confidence}%`, height: '100%', borderRadius: 'var(--radius-full)' }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: '0.75rem', borderTop: '1px solid var(--card-border)', paddingTop: '1rem' }}>
                    <button
                      onClick={() => navigate(`/report/${item._id}`)}
                      className="btn-professional-fluid secondary"
                      style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'center', borderRadius: 'var(--radius-md)' }}
                    >
                      <Eye size={14} />
                      Diagnostics
                    </button>
                    <button
                      onClick={(e) => handleDownload(e, item._id)}
                      disabled={downloadingId === item._id}
                      className="btn-professional-fluid primary"
                      style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'center', borderRadius: 'var(--radius-md)' }}
                    >
                      {downloadingId === item._id ? (
                        <>
                          <span className="loading-spinner" style={{ width: '12px', height: '12px', borderWidth: '1.5px', borderTopColor: 'var(--black)' }}></span>
                          PDF...
                        </>
                      ) : (
                        <>
                          <Download size={14} />
                          Report
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Archive;
