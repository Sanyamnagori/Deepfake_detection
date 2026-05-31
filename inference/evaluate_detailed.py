import os
import sys
import cv2
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications.efficientnet import preprocess_input

# Set standard output encoding to UTF-8
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

print("=" * 80)
print("DEEPFAKE DETECTION SYSTEM: COMPREHENSIVE PERFORMANCE ANALYSIS")
print("=" * 80)

model_path = r'c:\Users\rajpu\Deepfake\Deepfake\inference\efficientnet_deepfake_ultra_final.h5'
threshold = 0.45

if not os.path.exists(model_path):
    print(f"Error: Model not found at {model_path}")
    sys.exit(1)

print("[LOADING] Loading high-accuracy model...")
model = tf.keras.models.load_model(model_path)
print("[OK] Model loaded successfully!\n")

face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

def process_and_predict(file_path):
    img_bgr = cv2.imread(file_path)
    if img_bgr is None:
        return None
        
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    img_h, img_w, _ = img_rgb.shape
    
    # Preprocessing Guard (from main.py)
    if img_h <= 350 and img_w <= 350:
        img_crop = img_rgb
    else:
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.1, 5, minSize=(30, 30))
        if len(faces) > 0:
            faces = sorted(faces, key=lambda x: x[2] * x[3], reverse=True)
            (x, y, w, h) = faces[0]
            if (w * h) / (img_w * img_h) > 0.65:
                img_crop = img_rgb
            else:
                padding = 0.2
                pad_w = int(w * padding)
                pad_h = int(h * padding)
                x1, y1 = max(0, x - pad_w), max(0, y - pad_h)
                x2, y2 = min(img_w, x + w + pad_w), min(img_h, y + h + pad_h)
                img_crop = img_rgb[y1:y2, x1:x2]
        else:
            img_crop = img_rgb
            
    img_final = cv2.resize(img_crop, (224, 224)).astype(np.float32)
    img_final = preprocess_input(img_final)
    img_final = np.expand_dims(img_final, axis=0)
    
    pred = float(model.predict(img_final, verbose=0)[0][0])
    return pred

def evaluate_directory(data_dir, max_samples=300):
    real_dir = os.path.join(data_dir, 'real')
    fake_dir = os.path.join(data_dir, 'fake')
    
    if not os.path.exists(real_dir) or not os.path.exists(fake_dir):
        print(f"Directory skipped: {data_dir} (does not contain real/ and fake/ subfolders)")
        return
        
    print(f"📊 Analyzing: {data_dir}")
    print(f"   (Sampling up to {max_samples} balanced images per class...)")
    
    def evaluate_class(folder, expected_label):
        files = [f for f in os.listdir(folder) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        if not files:
            return []
            
        np.random.seed(42)
        sampled_files = np.random.choice(files, min(max_samples, len(files)), replace=False)
        
        preds = []
        for f in sampled_files:
            file_path = os.path.join(folder, f)
            pred = process_and_predict(file_path)
            if pred is not None:
                preds.append(pred)
        return preds

    real_preds = evaluate_class(real_dir, 1)
    fake_preds = evaluate_class(fake_dir, 0)
    
    real_len = len(real_preds)
    fake_len = len(fake_preds)
    
    if real_len == 0 or fake_len == 0:
        print("Error: Could not load class images.")
        return
        
    tp = sum(1 for p in fake_preds if p < threshold) # True Fake (fake predicted as fake)
    tn = sum(1 for p in real_preds if p >= threshold) # True Real (real predicted as real)
    fp = sum(1 for p in real_preds if p < threshold) # False Fake (real predicted as fake)
    fn = sum(1 for p in fake_preds if p >= threshold) # False Real (fake predicted as real)
    
    total = real_len + fake_len
    correct = tp + tn
    accuracy = correct / total
    
    print("-" * 60)
    print(f"  Overall Accuracy        : {accuracy*100:.2f}% ({correct}/{total})")
    print(f"  Real Detection Accuracy : {tn/real_len*100:.2f}% ({tn}/{real_len})")
    print(f"  Fake Detection Accuracy : {tp/fake_len*100:.2f}% ({tp}/{fake_len})")
    print(f"  False Fakes (Real -> Fake): {fp/real_len*100:.2f}% ({fp}/{real_len})")
    print(f"  False Reals (Fake -> Real): {fn/fake_len*100:.2f}% ({fn}/{fake_len})")
    print("-" * 60 + "\n")

evaluate_directory(r'C:\Users\rajpu\OneDrive\Desktop\AI\inference\dataset', max_samples=300)
evaluate_directory(r'C:\Users\rajpu\OneDrive\Desktop\AI\inference\dataset_processed', max_samples=300)
