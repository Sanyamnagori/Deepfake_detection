import os
import sys
import numpy as np
import cv2

# Set standard output encoding to UTF-8
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

print("=" * 80)
print("DEEPFAKE DETECTION: PERFORMANCE EVALUATION UTILITY")
print("=" * 80)

# Import dependencies
try:
    import tensorflow as tf
    from tensorflow.keras.applications.efficientnet import preprocess_input
except ImportError:
    print("[ERROR] TensorFlow is not installed. Please run: pip install tensorflow")
    sys.exit(1)

base_dir = os.path.dirname(os.path.abspath(__file__))
project_dir = os.path.abspath(os.path.join(base_dir, ".."))

def evaluate_on_dataset(model, dataset_dir, max_files=200):
    subfolders = os.listdir(dataset_dir)
    subfolders_lower = [f.lower() for f in subfolders]

    real_files = []
    fake_files = []
    valid_exts = ('.jpg', '.jpeg', '.png')

    if "real" in subfolders_lower and "fake" in subfolders_lower:
        # Style 1: real/ and fake/
        real_folder = next(f for f in subfolders if f.lower() == "real")
        fake_folder = next(f for f in subfolders if f.lower() == "fake")
        
        real_path = os.path.join(dataset_dir, real_folder)
        fake_path = os.path.join(dataset_dir, fake_folder)
        
        for file_name in os.listdir(real_path):
            if file_name.lower().endswith(valid_exts):
                real_files.append((os.path.join(real_path, file_name), 0))
                
        for file_name in os.listdir(fake_path):
            if file_name.lower().endswith(valid_exts):
                fake_files.append((os.path.join(fake_path, file_name), 1))
    else:
        # Style 2: Frames(cropped+aligned)/original/ and fake subfolders
        real_folders = [os.path.join(dataset_dir, f) for f in subfolders if f.lower() == "original"]
        fake_folders = [os.path.join(dataset_dir, f) for f in subfolders if f.lower() in ["deepfakes", "face2face", "faceshifter", "faceswap", "neuraltextures"]]
        
        for path in real_folders:
            for file_name in os.listdir(path):
                if file_name.lower().endswith(valid_exts):
                    real_files.append((os.path.join(path, file_name), 0))
                    
        for path in fake_folders:
            for file_name in os.listdir(path):
                if file_name.lower().endswith(valid_exts):
                    fake_files.append((os.path.join(path, file_name), 1))

    if not real_files or not fake_files:
        return None

    # Sample evenly
    half_max = max_files // 2
    np.random.seed(42)
    
    if len(real_files) > half_max:
        indices = np.random.choice(len(real_files), half_max, replace=False)
        real_files = [real_files[i] for i in indices]
        
    if len(fake_files) > half_max:
        indices = np.random.choice(len(fake_files), half_max, replace=False)
        fake_files = [fake_files[i] for i in indices]

    test_cases = real_files + fake_files
    np.random.shuffle(test_cases)

    tp, tn, fp, fn = 0, 0, 0, 0
    
    for file_path, true_label in test_cases:
        try:
            img = cv2.imread(file_path)
            img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            img_final = cv2.resize(img_rgb, (224, 224))
            img_final = img_final.astype(np.float32)
            img_final = preprocess_input(img_final)
            img_final = np.expand_dims(img_final, axis=0)

            # Prediction (raw output closer to 0.0 is REAL, closer to 1.0 is FAKE)
            pred = float(model.predict(img_final, verbose=0)[0][0])
            predicted_label = 1 if pred >= 0.5 else 0
            
            if true_label == 0 and predicted_label == 0:
                tn += 1
            elif true_label == 1 and predicted_label == 1:
                tp += 1
            elif true_label == 0 and predicted_label == 1:
                fp += 1
            elif true_label == 1 and predicted_label == 0:
                fn += 1
        except Exception:
            pass

    processed = tp + tn + fp + fn
    accuracy = (tp + tn) / processed if processed > 0 else 0
    return {
        "accuracy": accuracy,
        "tp": tp, "tn": tn, "fp": fp, "fn": fn, "total": processed
    }

def main():
    model_paths = [
        ("Deployed Ultra Model", os.path.join(base_dir, "efficientnet_deepfake_ultra.h5")),
        ("Colab 5-ep Model", os.path.join(project_dir, "efficientnet_deepfake_final(new).h5")),
        ("Colab Ultra (Root Copy)", os.path.join(project_dir, "efficientnet_deepfake_ultra.h5"))
    ]
    
    models_to_eval = []
    print("\n[DETECTING MODEL FILES]")
    for label, path in model_paths:
        if os.path.exists(path):
            print(f" -> Found {label} at: {path}")
            models_to_eval.append((label, path))
        else:
            print(f" -> (Not found) {label}")
            
    if not models_to_eval:
        print("[ERROR] No model files found on disk. Aborting evaluation.")
        return

    # Load detected models
    loaded_models = []
    for label, path in models_to_eval:
        print(f"\n[LOADING] Loading {label}...")
        try:
            model = tf.keras.models.load_model(path)
            loaded_models.append((label, model, path))
            print(f"[OK] {label} loaded successfully!")
        except Exception as e:
            print(f"[ERROR] Failed to load {label}: {e}")

    if not loaded_models:
        print("[ERROR] No models could be loaded. Aborting.")
        return

    # Compare parameters & disk sizes
    print("\n" + "=" * 80)
    print("📋 ARCHITECTURE & DISK COMPARISON")
    print("=" * 80)
    
    header = f"{'Model Descriptor':<30} | {'Parameters':<18} | {'File Size on Disk':<18}"
    print(header)
    print("-" * len(header))
    for label, model, path in loaded_models:
        params = f"{model.count_params():,d}"
        size = f"{os.path.getsize(path)/(1024*1024):.2f} MB"
        print(f"{label:<30} | {params:<18} | {size:<18}")
    
    # Check which dataset to use
    custom_dataset_dir = os.path.join(project_dir, "dataset")
    aligned_frames_dir = os.path.join(project_dir, "Frames(cropped+aligned)")
    
    if os.path.exists(custom_dataset_dir):
        eval_dir = custom_dataset_dir
        dataset_name = "CUSTOM DATASET (dataset/)"
    elif os.path.exists(aligned_frames_dir):
        eval_dir = aligned_frames_dir
        dataset_name = "ALIGNED FRAMES (Frames(cropped+aligned)/)"
    else:
        eval_dir = None
        
    if eval_dir:
        print("\n" + "=" * 80)
        print(f"📊 PERFORMANCE COMPARISON ON {dataset_name} (200 Balanced Samples)")
        print("=" * 80)
        print("[EVALUATING] Running predictions... please wait...")
        
        results = []
        for label, model, path in loaded_models:
            res = evaluate_on_dataset(model, eval_dir, max_files=200)
            if res:
                results.append((label, res))
                
        if results:
            # Print Accuracy Table
            col_width = 22
            metrics_labels = [
                ("Accuracy Score", lambda r: f"{r['accuracy']*100:.2f}%"),
                ("True Real (Real correct)", lambda r: f"{r['tn']}"),
                ("True Fake (Fake correct)", lambda r: f"{r['tp']}"),
                ("False Real (Fake predicted Real)", lambda r: f"{r['fn']}"),
                ("False Fake (Real predicted Fake)", lambda r: f"{r['fp']}"),
            ]
            
            # Print headers
            header_row = f"{'Performance Metric':<35}"
            for label, _ in results:
                header_row += f" | {label:<{col_width}}"
            print(header_row)
            print("-" * len(header_row))
            
            # Print rows
            for m_name, extractor in metrics_labels:
                row = f"{m_name:<35}"
                for label, res in results:
                    val = extractor(res)
                    row += f" | {val:<{col_width}}"
                print(row)
        else:
            print("[WARN] Evaluation skipped: dataset contains no valid file classes.")
    else:
        print("\n[INFO] No dataset folders found. Skipping accuracy test.")
        
    print("=" * 80)

if __name__ == '__main__':
    main()
