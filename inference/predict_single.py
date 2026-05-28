import os
import sys
import argparse
import numpy as np

# Set standard output encoding to UTF-8
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

print("=" * 80)
print("DEEPFAKE DETECTION: SINGLE FILE PREDICTOR")
print("=" * 80)

# Import TensorFlow
try:
    import tensorflow as tf
except ImportError:
    print("[ERROR] TensorFlow is not installed. Please run: pip install tensorflow")
    sys.exit(1)

# Import Main server functions for preprocessing
base_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(base_dir)

try:
    import main
except Exception as e:
    print(f"[ERROR] Failed to load server functions: {e}")
    sys.exit(1)

# Set model environment variable to the deployed model
os.environ["MODEL_PATH"] = os.path.join(base_dir, "efficientnet_deepfake_final.h5")
os.environ["ALLOW_MESONET_FALLBACK"] = "false"
os.environ["ALLOW_PLACEHOLDER_MODEL"] = "false"

# Load the model using main.py's loading function
print("[LOADING] Loading model and configurations...")
try:
    main.load_mesonet_model()
    if main.mesonet_model is None:
        print("[ERROR] Failed to load model weights.")
        sys.exit(1)
    print(f"[OK] Model loaded successfully! (Architecture: {main.MODEL_TYPE})")
except Exception as e:
    print(f"[ERROR] Failed to load model: {e}")
    sys.exit(1)

def run_prediction(file_path):
    if not os.path.exists(file_path):
        print(f"[ERROR] File not found: {file_path}")
        return

    ext = os.path.splitext(file_path)[1].lower()
    is_video = ext in ['.mp4', '.avi', '.mov', '.mkv']

    print(f"\n[ANALYZING] Processing file: {file_path}")
    try:
        if is_video:
            print("   - Video detected. Extracting and preprocessing frames...")
            processed_frames = main.preprocess_video(file_path)
            print(f"   - Extracted {len(processed_frames)} face frames.")
            
            predictions = []
            for i, frame in enumerate(processed_frames):
                pred = float(main.mesonet_model.predict(frame, verbose=0)[0][0])
                predictions.append(pred)
            
            avg_output = sum(predictions) / len(predictions)
            model_output = avg_output
            
        else:
            print("   - Image detected. Detecting face and preprocessing...")
            processed_img = main.preprocess_image(file_path)
            model_output = float(main.mesonet_model.predict(processed_img, verbose=0)[0][0])
            
        prob_real = 1.0 - model_output
        prob_fake = model_output

        # Threshold check
        if model_output >= 0.5:
            verdict = "FAKE"
            confidence = prob_fake
        else:
            verdict = "REAL"
            confidence = prob_real

        print("\n" + "=" * 80)
        print("🎯 DETECTION RESULT")
        print("=" * 80)
        print(f"Verdict     : {verdict}")
        print(f"Confidence  : {confidence * 100:.2f}%")
        print("-" * 80)
        print(f"Probability (Real): {prob_real * 100:.2f}%")
        print(f"Probability (Fake): {prob_fake * 100:.2f}%")
        print("=" * 80)

    except Exception as e:
        print(f"[ERROR] Prediction failed: {e}")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Predict single file (image/video) for deepfake detection")
    parser.add_argument('file_path', type=str, help='Path to the image or video file to test')
    args = parser.parse_args()
    
    run_prediction(args.file_path)
