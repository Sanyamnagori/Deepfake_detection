import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import Upload from './components/Upload';
import Detect from './components/Detect';
import Report from './components/Report';
import { Home as HomeIcon, Upload as UploadIcon, Shield, LogOut, Sun, Moon } from 'lucide-react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import './App.css';

function Navigation({ isAuthenticated, setIsAuthenticated }) {
  const location = useLocation();
  const { isDarkMode, toggleTheme } = useTheme();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
  };

  return (
    <nav className="main-nav">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <Shield size={24} />
          <span>DeepFake Detector</span>
        </Link>
        <div className="nav-links">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            <HomeIcon size={18} />
            Home
          </Link>
          {isAuthenticated && (
            <Link to="/upload" className={`nav-link ${location.pathname === '/upload' ? 'active' : ''}`}>
              <UploadIcon size={18} />
              Upload
            </Link>
          )}
          
          <button onClick={toggleTheme} className="theme-toggle-btn" aria-label="Toggle Theme">
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {isAuthenticated && (
            <button onClick={handleLogout} className="nav-link logout-btn">
              <LogOut size={18} />
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="main-footer">
      <div className="footer-container">
        <p>&copy; 2024 DeepFake Detection System. Protecting digital authenticity.</p>
        <div className="footer-links">
          <a href="#privacy">Privacy Policy</a>
          <a href="#terms">Terms of Service</a>
          <a href="#contact">Contact</a>
        </div>
      </div>
    </footer>
  );
}

function AppContent({ isAuthenticated, setIsAuthenticated }) {
  return (
    <div className="App">
      <Navigation isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home isAuthenticated={isAuthenticated} />} />
          <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
          <Route path="/register" element={<Register setIsAuthenticated={setIsAuthenticated} />} />
          <Route path="/upload" element={isAuthenticated ? <Upload /> : <Navigate to="/login" />} />
          <Route path="/detect/:uploadId" element={isAuthenticated ? <Detect /> : <Navigate to="/login" />} />
          <Route path="/report/:resultId" element={isAuthenticated ? <Report /> : <Navigate to="/login" />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is authenticated on app load
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    // Only set authenticated if both token and user exist
    if (token && user) {
      setIsAuthenticated(true);
    } else {
      // Clear any partial authentication data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsAuthenticated(false);
    }
  }, []);

  return (
    <ThemeProvider>
      <Router>
        <AppContent isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
      </Router>
    </ThemeProvider>
  );
}

export default App;
