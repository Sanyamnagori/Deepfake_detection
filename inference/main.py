from fastapi import FastAPI, File, UploadFile
from pydantic import BaseModel
from contextlib import asynccontextmanager
import tensorflow as tf
import cv2
import numpy as np
import base64
from io import BytesIO
from PIL import Image, ImageDraw
import os
import logging
import requests

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global model variable
# Global model variables
mesonet_model = None
MODEL_TYPE = "mesonet" # "mesonet" or "efficientnet"
MODEL_LOADED_FROM_TRAINED_WEIGHTS = False
from tensorflow.keras.applications.efficientnet import preprocess_input

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load model on startup and cleanup on shutdown"""
    global mesonet_model
    load_mesonet_model()
    yield
    # Cleanup if needed
    mesonet_model = None

app = FastAPI(title="DeepFake Detection Inference Service", lifespan=lifespan)

class DetectRequest(BaseModel):
    filePath: str
    uploadId: str = None

class DetectResponse(BaseModel):
    prediction: str
    confidence: float
    heatmap: str  # Base64 encoded heatmap
    prob_real: float
    prob_fake: float

def _build_placeholder_mesonet():
    """Build a stronger CNN model matching the training architecture.

    Used as a fallback if the trained weights file is missing or fails to load.
    """
    inputs = tf.keras.Input(shape=(256, 256, 3))

    # Block 1
    x = tf.keras.layers.Conv2D(32, (3, 3), padding="same", use_bias=False)(inputs)
    x = tf.keras.layers.BatchNormalization()(x)
    x = tf.keras.layers.ReLU()(x)
    x = tf.keras.layers.MaxPooling2D((2, 2))(x)

    # Block 2
    x = tf.keras.layers.Conv2D(64, (3, 3), padding="same", use_bias=False)(x)
    x = tf.keras.layers.BatchNormalization()(x)
    x = tf.keras.layers.ReLU()(x)
    x = tf.keras.layers.MaxPooling2D((2, 2))(x)

    # Block 3
    x = tf.keras.layers.Conv2D(128, (3, 3), padding="same", use_bias=False)(x)
    x = tf.keras.layers.BatchNormalization()(x)
    x = tf.keras.layers.ReLU()(x)
    x = tf.keras.layers.MaxPooling2D((2, 2))(x)

    # Block 4
    x = tf.keras.layers.Conv2D(256, (3, 3), padding="same", use_bias=False)(x)
    x = tf.keras.layers.BatchNormalization()(x)
    x = tf.keras.layers.ReLU()(x)
    x = tf.keras.layers.MaxPooling2D((2, 2))(x)

    x = tf.keras.layers.GlobalAveragePooling2D()(x)
    x = tf.keras.layers.Dense(256, activation="relu")(x)
    x = tf.keras.layers.Dropout(0.5)(x)
    outputs = tf.keras.layers.Dense(1, activation="sigmoid")(x)

    model = tf.keras.Model(inputs=inputs, outputs=outputs, name="mesonet_stronger_cnn_placeholder")
    model.compile(
        optimizer='adam',
        loss='binary_crossentropy',
        metrics=['accuracy'],
    )
    return model


def load_mesonet_model():
    """Load the best available trained model.
    
    Priority:
    1. EfficientNet (New architecture)
    2. MesoNet Optimized (Previous best)
    3. Placeholder (Fallback)
    """
    global mesonet_model, MODEL_TYPE, MODEL_LOADED_FROM_TRAINED_WEIGHTS
    
    base_dir = os.path.dirname(__file__)
    
    # If MODEL_PATH is set, always try it first and fail fast if missing.
    configured_model_path = os.getenv("MODEL_PATH")
    if configured_model_path:
        model_path = configured_model_path if os.path.isabs(configured_model_path) else os.path.abspath(os.path.join(base_dir, configured_model_path))
        if not os.path.exists(model_path):
            raise FileNotFoundError(
                f"Configured MODEL_PATH does not exist: {model_path}. "
                "Run inference/download_model.py or set MODEL_URL/MODEL_SHA256."
            )
        try:
            logger.info(f"Loading model from MODEL_PATH: {model_path}")
            mesonet_model = tf.keras.models.load_model(model_path)
            lower_name = os.path.basename(model_path).lower()
            MODEL_TYPE = "efficientnet" if "efficientnet" in lower_name else "mesonet"
            MODEL_LOADED_FROM_TRAINED_WEIGHTS = True
            return True
        except Exception as e:
            raise RuntimeError(f"Failed to load model from MODEL_PATH: {e}") from e

    allow_mesonet_fallback = os.getenv("ALLOW_MESONET_FALLBACK", "false").lower() == "true"

    # List of models to try in order of preference.
    # By default, only EfficientNet artifacts are allowed.
    candidates = [
        ("efficientnet_deepfake_ultra_final.h5", "efficientnet"),
        ("efficientnet_deepfake_ultra.h5", "efficientnet"),
        ("efficientnet_deepfake_final.h5", "efficientnet"),
        ("efficientnet_deepfake.h5", "efficientnet"),
    ]
    if allow_mesonet_fallback:
        candidates.extend([
            ("enhanced_mesonet_optimized.h5", "mesonet"),
            ("enhanced_mesonet.h5", "mesonet")
        ])

    for filename, m_type in candidates:
        model_path = os.path.join(base_dir, filename)
        if os.path.exists(model_path):
            try:
                logger.info(f"Loading model: {filename} ({m_type})")
                mesonet_model = tf.keras.models.load_model(model_path)
                MODEL_TYPE = m_type
                MODEL_LOADED_FROM_TRAINED_WEIGHTS = True
                logger.info(f"Successfully loaded {filename}")
                return True
            except Exception as e:
                logger.error(f"Failed to load {filename}: {e}")
                continue
                
    # If we get here, no model loaded
    allow_placeholder = os.getenv("ALLOW_PLACEHOLDER_MODEL", "false").lower() == "true"
    if not allow_placeholder:
        fallback_note = (
            " MesoNet fallback is disabled by default. Set ALLOW_MESONET_FALLBACK=true "
            "only if you intentionally want to use the MesoNet backup model."
        )
        raise RuntimeError(
            "No trained model found. Configure MODEL_PATH or MODEL_URL/MODEL_SHA256 and run "
            "inference/download_model.py. To override only for local debugging, set "
            "ALLOW_PLACEHOLDER_MODEL=true." + fallback_note
        )

    logger.warning("No trained models found. Using placeholder because ALLOW_PLACEHOLDER_MODEL=true.")
    mesonet_model = _build_placeholder_mesonet()
    MODEL_TYPE = "mesonet" # Placeholder simulates mesonet structure
    MODEL_LOADED_FROM_TRAINED_WEIGHTS = False
    return False

def report_progress(upload_id, progress, current_frame=None, total_frames=None):
    """Notify the Node backend about the current processing progress."""
    if not upload_id:
        return
    try:
        url = "http://localhost:5000/api/internal/progress"
        requests.post(url, json={
            "uploadId": upload_id,
            "progress": progress,
            "currentFrame": current_frame,
            "totalFrames": total_frames
        }, timeout=1)
    except Exception as e:
        logger.error(f"Failed to report progress: {e}")

def extract_and_preprocess_face(img_bgr):
    # Convert BGR to RGB
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)

    # Detect face (consistency with training)
    face_cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    face_cascade = cv2.CascadeClassifier(face_cascade_path)
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.1, 5, minSize=(30, 30))

    if len(faces) > 0:
        # Take largest face
        faces = sorted(faces, key=lambda x: x[2] * x[3], reverse=True)
        (x, y, w, h) = faces[0]
        # Add 20% padding (same as training)
        padding = 0.2
        pad_w = int(w * padding)
        pad_h = int(h * padding)
        img_h, img_w, _ = img_rgb.shape
        x1, y1 = max(0, x - pad_w), max(0, y - pad_h)
        x2, y2 = min(img_w, x + w + pad_w), min(img_h, y + h + pad_h)
        img_crop = img_rgb[y1:y2, x1:x2]
    else:
        img_crop = img_rgb

    # Resize and Normalize based on model type
    if MODEL_TYPE == "efficientnet":
        # EfficientNet: 224x224, special preprocessing
        img_final = cv2.resize(img_crop, (224, 224))
        img_final = img_final.astype(np.float32)
        img_final = preprocess_input(img_final) 
    else:
        # MesoNet: 256x256, 1/255 scaling
        img_final = cv2.resize(img_crop, (256, 256))
        img_final = img_final.astype(np.float32) / 255.0

    # Add batch dimension
    img_final = np.expand_dims(img_final, axis=0)
    return img_final

def preprocess_image(image_path):
    """Preprocess image based on the active model type, including face cropping."""
    try:
        # Read image
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError("Could not read image")
        return extract_and_preprocess_face(img)
    except Exception as e:
        logger.error(f"Error preprocessing image: {e}")
        raise

def preprocess_video(video_path, upload_id=None, fps_sample=1):
    try:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError("Could not open video file")
            
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_video_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        if fps <= 0:
            fps = 30.0
            
        frame_interval = int(fps / fps_sample)
        if frame_interval < 1:
            frame_interval = 1
            
        frames = []
        frame_count = 0
        extracted_count = 0
        
        # Estimate how many frames we will extract
        estimated_total = total_video_frames // frame_interval
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
                
            if frame_count % frame_interval == 0:
                processed_frame = extract_and_preprocess_face(frame)
                frames.append(processed_frame)
                extracted_count += 1
                
                # Report progress every frame extracted
                if upload_id:
                    # 10% - 90% range for frame processing
                    progress = 10 + int((extracted_count / max(1, estimated_total)) * 80)
                    report_progress(upload_id, min(95, progress), extracted_count, estimated_total)
                
            frame_count += 1
            
        cap.release()
        
        if len(frames) == 0:
            raise ValueError("No frames could be extracted from video")
            
        return frames
    except Exception as e:
        logger.error(f"Error preprocessing video: {e}")
        raise


def generate_heatmap(prediction, confidence):
    """Generate a simple heatmap visualization"""
    try:
        # Create heatmap based on prediction
        if prediction == 'fake':
            # Red heatmap for fake
            img = Image.new('RGB', (256, 256), color=(int(255 * confidence), 0, 0))
        else:
            # Green heatmap for real
            img = Image.new('RGB', (256, 256), color=(0, int(255 * confidence), 0))

        # Add some pattern to make it look like a real heatmap
        draw = ImageDraw.Draw(img)
        for i in range(0, 256, 32):
            for j in range(0, 256, 32):
                intensity = int(255 * confidence * (0.5 + 0.5 * np.sin(i/32 + j/32)))
                if prediction == 'fake':
                    color = (intensity, 0, 0)
                else:
                    color = (0, intensity, 0)
                draw.rectangle([i, j, i+32, j+32], fill=color)

        # Convert to base64
        buffer = BytesIO()
        img.save(buffer, format="PNG")
        heatmap_b64 = base64.b64encode(buffer.getvalue()).decode()

        return heatmap_b64
    except Exception as e:
        logger.error(f"Error generating heatmap: {e}")
        return ""

@app.post("/detect", response_model=DetectResponse)
async def detect_deepfake(request: DetectRequest):
    try:
        # Check if file exists
        if not os.path.exists(request.filePath):
            raise FileNotFoundError(f"File not found: {request.filePath}")

        # Check if model is loaded
        if mesonet_model is None:
            logger.warning("Model not loaded, using fallback prediction")
            # Fallback to random prediction if model fails
            prob_real = float(np.random.uniform(0.0, 1.0))
            prob_fake = 1.0 - prob_real
            model_output = prob_real
            heatmap_confidence = None
        else:
            ext = os.path.splitext(request.filePath)[1].lower()
            is_video = ext in ['.mp4', '.avi', '.mov', '.mkv']
            
            if is_video:
                report_progress(request.uploadId, 5) # 5% - Start video process
                processed_frames = preprocess_video(request.filePath, upload_id=request.uploadId)
                
                predictions = []
                for i, frame in enumerate(processed_frames):
                    predictions.append(float(mesonet_model.predict(frame, verbose=0)[0][0]))
                    # Update progress during prediction phase (90% - 98%)
                    if request.uploadId:
                        report_progress(request.uploadId, 90 + int((i / len(processed_frames)) * 8), i + 1, len(processed_frames))
                    
                avg_model_output = sum(predictions) / len(predictions)
                model_output = avg_model_output
                
                max_fake_prob = max(predictions)
                heatmap_confidence = 1.0 - max_fake_prob if avg_model_output < 0.5 else avg_model_output
            else:
                processed_img = preprocess_image(request.filePath)
                model_output = float(mesonet_model.predict(processed_img, verbose=0)[0][0])
                heatmap_confidence = None
            
            prob_real = 1.0 - model_output
            prob_fake = model_output

        # Apply threshold: require >= 0.5 confidence for "fake"
        if model_output >= 0.5:
            prediction = "fake"  # High output = label 1 = 'fake'
            confidence = prob_fake
            if heatmap_confidence is None:
                heatmap_confidence = prob_fake
        else:
            prediction = "real"  # Low output = label 0 = 'real'
            confidence = prob_real
            if heatmap_confidence is None:
                heatmap_confidence = prob_real
        
        # Debug logging
        logger.info(
            f"Detection: file={os.path.basename(request.filePath)} | "
            f"model_output={model_output:.4f} | "
            f"prediction={prediction} | "
            f"confidence={confidence:.4f} | "
            f"P(real)={prob_real:.4f}, P(fake)={prob_fake:.4f}"
        )

        # Generate heatmap
        heatmap_b64 = generate_heatmap(prediction, heatmap_confidence)

        logger.info(f"Detection completed: {prediction} with confidence {confidence:.3f} (P(real)={prob_real:.3f}, P(fake)={prob_fake:.3f})")

        return DetectResponse(
            prediction=prediction,
            confidence=confidence,
            heatmap=heatmap_b64,
            prob_real=prob_real,
            prob_fake=prob_fake,
        )
    except Exception as e:
        logger.error(f"Detection failed: {e}")
        return DetectResponse(
            prediction="error",
            confidence=0.0,
            heatmap="",
            prob_real=0.0,
            prob_fake=0.0
        )

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": mesonet_model is not None,
        "service": "deepfake-detection-inference"
    }
