import os
import sys
import argparse
import numpy as np

# Set standard output encoding to UTF-8
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

base_dir = os.path.dirname(os.path.abspath(__file__))

print("=" * 80)
print("DEEPFAKE DETECTION: DATASET EVALUATION UTILITY")
print("=" * 80)

# Import dependencies
try:
    import tensorflow as tf
    from tensorflow.keras.preprocessing.image import ImageDataGenerator
    from tensorflow.keras.applications.efficientnet import preprocess_input
except ImportError:
    print("[ERROR] TensorFlow is not installed. Please run: pip install tensorflow")
    sys.exit(1)

try:
    import cv2
except ImportError:
    print("[ERROR] OpenCV is not installed. Please run: pip install opencv-python")
    sys.exit(1)

# --- Preprocessing functions copied directly from main.py for independence ---

def extract_and_preprocess_face(img_bgr, model_type="efficientnet"):
    # Convert BGR to RGB
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)

    # Detect face (consistency with training)
    face_cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    face_cascade = cv2.CascadeClassifier(face_cascade_path)
    if face_cascade.empty():
        raise RuntimeError(f"Could not load Haar Cascade XML from path: {face_cascade_path}")
        
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.1, 5, minSize=(30, 30))

    if len(faces) > 0:
        # Take largest face
        faces = sorted(faces, key=lambda x: x[2] * x[3], reverse=True)
        (x, y, w, h) = faces[0]
        # Add 20% padding
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
    if model_type == "efficientnet":
        img_final = cv2.resize(img_crop, (224, 224))
        img_final = img_final.astype(np.float32)
        img_final = preprocess_input(img_final) 
    else:
        img_final = cv2.resize(img_crop, (256, 256))
        img_final = img_final.astype(np.float32) / 255.0

    # Add batch dimension
    img_final = np.expand_dims(img_final, axis=0)
    return img_final

def preprocess_image(image_path, model_type="efficientnet"):
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError("Could not read image")
    return extract_and_preprocess_face(img, model_type)

def preprocess_video(video_path, model_type="efficientnet", fps_sample=1):
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError("Could not open video file")
        
    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps <= 0:
        fps = 30.0
        
    frame_interval = int(fps / fps_sample)
    if frame_interval < 1:
        frame_interval = 1
        
    frames = []
    frame_count = 0
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
            
        if frame_count % frame_interval == 0:
            processed_frame = extract_and_preprocess_face(frame, model_type)
            frames.append(processed_frame)
            
        frame_count += 1
        
    cap.release()
    if len(frames) == 0:
        raise ValueError("No frames could be extracted from video")
        
    return frames

# --- Evaluation Logic ---

def evaluate_dataset(data_dir):
    if not os.path.exists(data_dir):
        print(f"[ERROR] Dataset directory not found: {data_dir}")
        return

    # Find real and fake subfolders dynamically
    subfolders = os.listdir(data_dir)
    real_subfolder = None
    fake_subfolder = None

    for f in subfolders:
        path = os.path.join(data_dir, f)
        if os.path.isdir(path):
            name_lower = f.lower()
            if "real" in name_lower:
                real_subfolder = path
            elif "fake" in name_lower:
                fake_subfolder = path

    if not real_subfolder or not fake_subfolder:
        print("[ERROR] Could not find both 'real' and 'fake' subfolders.")
        print(f"Subfolders found: {subfolders}")
        print("Please ensure your directory contains folders like 'real'/'fake' or 'videos_real'/'videos_fake'.")
        return

    print(f"[OK] Found real subfolder: {os.path.basename(real_subfolder)}")
    print(f"[OK] Found fake subfolder: {os.path.basename(fake_subfolder)}")

    # Files to process
    test_cases = [] # list of tuples: (file_path, true_label) where 1=real, 0=fake
    valid_exts = ('.mp4', '.avi', '.mov', '.mkv', '.jpg', '.jpeg', '.png')
    
    for file_name in os.listdir(real_subfolder):
        if file_name.lower().endswith(valid_exts):
            test_cases.append((os.path.join(real_subfolder, file_name), 1))
            
    for file_name in os.listdir(fake_subfolder):
        if file_name.lower().endswith(valid_exts):
            test_cases.append((os.path.join(fake_subfolder, file_name), 0))

    total_files = len(test_cases)
    if total_files == 0:
        print("[ERROR] No valid images or videos found in the subfolders.")
        return

    # Load Model
    model_path = os.path.join(base_dir, "efficientnet_deepfake_final.h5")
    if not os.path.exists(model_path):
        print(f"[ERROR] Deployed model not found at: {model_path}")
        return
        
    print(f"\n[LOADING] Loading model: {model_path}...")
    try:
        model = tf.keras.models.load_model(model_path)
        print(f"[OK] Model loaded successfully! (Architecture: {model.name})")
    except Exception as e:
        print(f"[ERROR] Failed to load model: {e}")
        return

    # Check model architecture to set preprocessing parameters
    model_type = "efficientnet"
    for layer in model.layers:
        if 'efficientnet' in layer.name.lower():
            model_type = "efficientnet"
            break
            
    print(f"[INFO] Using preprocessing mode: {model_type}")
    print(f"[DATA] Found {total_files} files to evaluate. Starting predictions...")

    tp, tn, fp, fn = 0, 0, 0, 0
    failures = 0

    for idx, (file_path, true_label) in enumerate(test_cases):
        file_name = os.path.basename(file_path)
        ext = os.path.splitext(file_path)[1].lower()
        is_video = ext in ('.mp4', '.avi', '.mov', '.mkv')
        
        print(f"[{idx+1}/{total_files}] Processing {file_name}...")
        
        try:
            if is_video:
                processed_frames = preprocess_video(file_path, model_type)
                predictions = []
                for frame in processed_frames:
                    pred = float(model.predict(frame, verbose=0)[0][0])
                    predictions.append(pred)
                model_output = sum(predictions) / len(predictions)
            else:
                processed_img = preprocess_image(file_path, model_type)
                model_output = float(model.predict(processed_img, verbose=0)[0][0])

            # Apply 0.5 threshold
            predicted_label = 1 if model_output >= 0.5 else 0
            
            # Update metrics
            if true_label == 1 and predicted_label == 1:
                tp += 1
                print(f"   -> P(real)={model_output:.4f} | Verdict: REAL (Correct)")
            elif true_label == 0 and predicted_label == 0:
                tn += 1
                print(f"   -> P(real)={model_output:.4f} | Verdict: FAKE (Correct)")
            elif true_label == 0 and predicted_label == 1:
                fp += 1
                print(f"   -> P(real)={model_output:.4f} | Verdict: REAL (Incorrect - False Positive)")
            elif true_label == 1 and predicted_label == 0:
                fn += 1
                print(f"   -> P(real)={model_output:.4f} | Verdict: FAKE (Incorrect - False Negative)")
                
        except Exception as e:
            print(f"   -> [ERROR] Failed to process {file_name}: {e}")
            failures += 1

    processed_successfully = tp + tn + fp + fn
    if processed_successfully == 0:
        print("[ERROR] No files were successfully evaluated.")
        return

    accuracy = (tp + tn) / processed_successfully
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0
    f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0

    print("\n" + "=" * 80)
    print("📊 DATASET EVALUATION REPORT")
    print("=" * 80)
    print(f"Folder Evaluated      : {data_dir}")
    print(f"Overall Accuracy      : {accuracy * 100:.2f}%")
    print(f"Precision (Real)      : {precision * 100:.2f}%")
    print(f"Recall (Real)         : {recall * 100:.2f}%")
    print(f"F1-Score              : {f1:.4f}")
    print("-" * 80)
    print(f"Successfully Evaluated: {processed_successfully} files")
    print(f"Failed to Process     : {failures} files")
    print("-" * 80)
    print("🔍 Confusion Matrix:")
    print(f"{'':<15} | Predicted Real | Predicted Fake")
    print(f"{'Actual Real':<15} | {tp:14d} | {fn:14d}")
    print(f"{'Actual Fake':<15} | {fp:14d} | {tn:14d}")
    print("=" * 80)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Evaluate model on custom dataset")
    parser.add_argument('data_dir', type=str, help='Path to dataset directory')
    args = parser.parse_args()
    
    evaluate_dataset(args.data_dir)
