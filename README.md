# DeepFake Detection System

A full-stack MERN application with FastAPI inference service for detecting deepfakes in videos and images.

## Architecture

- **Frontend**: React.js (port 3000)
- **Backend**: Node.js/Express (port 5000)
- **Database**: MongoDB (port 27017)
- **Inference**: FastAPI/Python (port 8000)

## Features

- **Home Page**: Welcome page with app overview and navigation
- **Upload**: Secure file upload for images and videos
- **Detection**: AI-powered deepfake analysis
- **Reports**: Detailed PDF reports with confidence scores

## Workflow

1. Visit the home page for an overview
2. Upload video/image via the upload page
3. Run deepfake detection
4. Generate and download PDF report

## Quick Start (Windows)

### One-Command Start (Recommended)

Simply run:
```bash
node run.js
```

This will:
- Automatically install all dependencies if not present
- Start MongoDB (if not already running)
- Start the backend service (port 5000)
- Start the inference service (port 8000)
- Start the frontend (port 3000)

**Access the app:** Open http://localhost:3000 in your browser

### Manual Setup (Alternative)

#### Prerequisites
- Node.js (v16+)
- Python (v3.8+)
- MongoDB (local installation)

#### Installation
1. **Install dependencies:**
   ```bash
   # Backend
   cd backend && npm install

   # Frontend
   cd frontend && npm install

   # Inference
   cd inference && pip install -r requirements.txt
   ```

2. **Set environment variables:**
   Create `.env` file in root:
   ```
   MONGODB_URI=mongodb://localhost:27017/deepfake
   PORT=5000
   INFERENCE_URL=http://localhost:8000
   ```

#### Start Services
Open three terminals:

**Terminal 1 (Backend):**
```bash
cd backend
npm start
```

**Terminal 2 (Inference):**
```bash
cd inference
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

**Terminal 3 (Frontend):**
```bash
cd frontend
npm start
```

### Option 3: Docker Setup

For containerized deployment:

```bash
docker-compose up --build
```

## API Endpoints

### Backend
- `POST /api/upload` - Upload file
- `POST /api/detect` - Run detection
- `GET /api/report/:resultId` - Download PDF report

### Inference
- `POST /detect` - Stub detection endpoint

## TODO for Production

- Replace stub inference with real deepfake detection model (e.g., FaceForensics++, MesoNet)
- Add user authentication
- Implement file validation and size limits
- Add WebSocket real-time updates
- Enhance UI/UX
- Add comprehensive tests
- Implement logging and monitoring
- Secure API endpoints
- Add rate limiting

## Technologies

- React, Express, MongoDB, FastAPI
- Multer, Axios, PDFKit, WebSocket
- Docker, Docker Compose
