import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Upload, Brain, FileText, ArrowRight, LogIn, UserPlus, CheckCircle, Zap, Lock } from 'lucide-react';

function Home({ isAuthenticated }) {
  return (
    <div className="home-page">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <div className="hero-icon">
            <Shield size={72} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="cyber-badge" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 1.25rem',
              background: 'var(--primary-glow)',
              border: '1px solid var(--primary-glow)',
              borderRadius: '9999px',
              color: 'var(--primary)',
              fontSize: '0.8rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '1.5rem',
              boxShadow: 'var(--shadow-glow)'
            }}>
              <span className="loading-spinner" style={{
                width: '8px',
                height: '8px',
                border: '1.5px solid var(--primary-glow)',
                borderTopColor: 'var(--primary)',
                margin: 0
              }}></span>
              AI Core Security Active
            </div>
          </div>
          <h1 className="hero-title">Advanced Media Authenticity Verification</h1>
          <p className="hero-subtitle">
            Enterprise-grade AI protection against digital deception and misinformation
          </p>
          <div className="hero-description">
            <p>
              Our state-of-the-art deepfake detection technology analyzes images and videos
              with industry-leading accuracy. Trusted by professionals worldwide to combat
              synthetic media threats and ensure digital authenticity.
            </p>
          </div>
          <div className="hero-actions">
            {isAuthenticated ? (
              <Link to="/upload" className="btn-professional">
                <Upload size={20} />
                Upload & Verify Media
                <ArrowRight size={20} />
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn-professional">
                  <UserPlus size={20} />
                  Start Free Analysis
                  <ArrowRight size={20} />
                </Link>
                <Link to="/login" className="btn-professional btn-secondary">
                  <LogIn size={20} />
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="features-section">
        <h2>Professional Deepfake Detection</h2>
        <p>
          Our comprehensive platform provides enterprise-grade tools for media authenticity verification,
          combining cutting-edge AI with intuitive design for maximum reliability and ease of use.
        </p>
        <div className="features-grid">
          <div className="professional-card fade-in-up">
            <div className="feature-icon">
              <Upload />
            </div>
            <h3>Secure Upload</h3>
            <p>
              Upload images and videos with enterprise-grade security. Support for multiple formats
              with automatic validation and size optimization.
            </p>
          </div>
          <div className="professional-card fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="feature-icon">
              <Brain />
            </div>
            <h3>Advanced AI Analysis</h3>
            <p>
              Powered by MesoNet deep learning architecture trained on extensive datasets.
              Industry-leading accuracy with real-time processing capabilities.
            </p>
          </div>
          <div className="professional-card fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="feature-icon">
              <FileText />
            </div>
            <h3>Detailed Reports</h3>
            <p>
              Comprehensive analysis reports with confidence scores, heatmaps, and
              actionable insights. PDF export for documentation and compliance.
            </p>
          </div>
          <div className="professional-card fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="feature-icon">
              <Lock />
            </div>
            <h3>Enterprise Security</h3>
            <p>
              Bank-level encryption, GDPR compliance, and SOC 2 certified infrastructure.
              Your data privacy and security are our top priorities.
            </p>
          </div>
          <div className="professional-card fade-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="feature-icon">
              <Zap />
            </div>
            <h3>Lightning Fast</h3>
            <p>
              Optimized for performance with sub-second analysis times. Batch processing
              capabilities for high-volume media verification workflows.
            </p>
          </div>
          <div className="professional-card fade-in-up" style={{ animationDelay: '0.5s' }}>
            <div className="feature-icon">
              <CheckCircle />
            </div>
            <h3>Proven Accuracy</h3>
            <p>
              Validated against industry benchmarks with 94%+ detection accuracy.
              Continuous model improvement through ongoing research and training.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="cta-section">
        <h2>Ready to Protect Your Digital Assets?</h2>
        <p>
          Join leading organizations worldwide who trust our platform to detect deepfakes
          and ensure media authenticity. Start your free analysis today.
        </p>
        <Link to="/register" className="btn-professional">
          Create Free Account
          <ArrowRight size={20} />
        </Link>
      </div>
    </div>
  );
}

export default Home;
