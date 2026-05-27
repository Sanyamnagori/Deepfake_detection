import os
import sys
import numpy as np

# Set standard output encoding to UTF-8
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

print("=" * 80)
print("DEPLOYED MODEL TEST RUNNER")
print("=" * 80)

# 1. Imports
try:
    import tensorflow as tf
    from tensorflow.keras.preprocessing.image import ImageDataGenerator
    from tensorflow.keras.applications.efficientnet import preprocess_input
except ImportError:
    print("[ERROR] TensorFlow is not installed. Please run: pip install tensorflow")
    sys.exit(1)

# 2. Paths
base_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(base_dir, "efficientnet_deepfake_final.h5")

# Find the test dataset locally in the ddeepfake folder
test_dir = os.path.abspath(os.path.join(base_dir, "..", "..", "dataset_1", "test-20250112T065939Z-001", "test"))

if not os.path.exists(model_path):
    print(f"[ERROR] Trained model file not found at: {model_path}")
    print("Please make sure you renamed your new model and placed it in the inference directory.")
    sys.exit(1)

if not os.path.exists(test_dir):
    print(f"[ERROR] Test dataset folder not found at: {test_dir}")
    print("Please verify the location of dataset_1 on your system.")
    sys.exit(1)

print(f"\n[OK] Found deployed model: {model_path}")
print(f"[OK] Found test dataset: {test_dir}")

# 3. Load Model
print("\n[LOADING] Loading TensorFlow model into memory (this may take a few seconds)...")
try:
    model = tf.keras.models.load_model(model_path)
    print(f"[OK] Model loaded successfully! (Architecture: {model.name})")
except Exception as e:
    print(f"[ERROR] Failed to load model: {e}")
    sys.exit(1)

# 4. Prepare data generator
print("\n[DATA] Scanning test folder and preparing data...")
try:
    test_datagen = ImageDataGenerator(preprocessing_function=preprocess_input)
    test_generator = test_datagen.flow_from_directory(
        test_dir,
        target_size=(224, 224),
        batch_size=32,
        class_mode='binary',
        shuffle=False
    )
except Exception as e:
    print(f"[ERROR] Failed to load images: {e}")
    sys.exit(1)

if test_generator.samples == 0:
    print("[ERROR] No images found in test folder. Please check structure (must contain real/ and fake/ subfolders).")
    sys.exit(1)

# 5. Run Evaluation
print(f"\n[RUNNING] Running predictions on {test_generator.samples} test images...")
predictions = model.predict(test_generator, verbose=1)
predicted_classes = (predictions >= 0.5).astype(int).flatten()
true_classes = test_generator.classes

# 6. Calculate Metrics
accuracy = np.mean(predicted_classes == true_classes)

# Confusion matrix calculations
tp = np.sum((predicted_classes == 1) & (true_classes == 1))  # True Real
tn = np.sum((predicted_classes == 0) & (true_classes == 0))  # True Fake
fp = np.sum((predicted_classes == 1) & (true_classes == 0))  # False Real (Fake predicted as Real)
fn = np.sum((predicted_classes == 0) & (true_classes == 1))  # False Fake (Real predicted as Fake)

print("\n" + "=" * 80)
print("📊 TEST RESULTS SUMMARY")
print("=" * 80)
print(f"✅ Overall Test Accuracy: {accuracy*100:.2f}%")
print("-" * 80)
print(f"Total Test Images : {test_generator.samples}")
print(f"Correctly Classified : {tp + tn}")
print(f"Incorrectly Classified: {fp + fn}")
print("-" * 80)
print("🔍 Confusion Matrix:")
print(f"{'':<15} | Predicted Real | Predicted Fake")
print(f"{'Actual Real':<15} | {tp:14d} | {fn:14d}")
print(f"{'Actual Fake':<15} | {fp:14d} | {tn:14d}")
print("-" * 80)

# Per-class accuracy
real_total = tp + fn
fake_total = tn + fp
if real_total > 0:
    print(f"Real Detection Rate (Recall): {tp/real_total*100:.2f}%")
if fake_total > 0:
    print(f"Fake Detection Rate (Specificity): {tn/fake_total*100:.2f}%")

print("=" * 80)
