import os
import sys
import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications.efficientnet import preprocess_input

# Set standard output encoding to UTF-8
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

print("=" * 80)
print("EVALUATING MODEL ON ALL IMAGES IN PROCESSED DATASET")
print("=" * 80)

model_path = r'c:\Users\rajpu\Deepfake\Deepfake\inference\efficientnet_deepfake_ultra_final.h5'
data_dir = r'C:\Users\rajpu\OneDrive\Desktop\AI\inference\dataset_processed'
threshold = 0.45

if not os.path.exists(model_path):
    print(f"Error: Model not found at {model_path}")
    sys.exit(1)
if not os.path.exists(data_dir):
    print(f"Error: Dataset directory not found at {data_dir}")
    sys.exit(1)

print("[LOADING] Loading high-accuracy model...")
model = tf.keras.models.load_model(model_path)
print("[OK] Model loaded successfully!")

print("\n[PREPARING GENERATOR] Loading all processed images...")
# Since these are already preprocessed/double-cropped 256x256 images,
# we bypass further OpenCV Haar cascades and resize them standardly to 224x224
datagen = ImageDataGenerator(preprocessing_function=preprocess_input)

generator = datagen.flow_from_directory(
    data_dir,
    target_size=(224, 224),
    batch_size=64,
    class_mode='binary',
    shuffle=False
)

print(f"Class Indices detected: {generator.class_indices}")

print(f"\n[EVALUATING] Predicting on all {generator.samples} images... please wait...")
# Predict using highly optimized TensorFlow batch processing
predictions = model.predict(generator, verbose=1)

# Sigmoid predictions: high output is REAL, low output is FAKE
# Classify as REAL (1) if pred >= threshold, else FAKE (0)
predicted_classes = (predictions >= threshold).astype(int).flatten()
true_classes = generator.classes

tp = np.sum((predicted_classes == 0) & (true_classes == 0)) # True Fake (fake predicted as fake)
tn = np.sum((predicted_classes == 1) & (true_classes == 1)) # True Real (real predicted as real)
fp = np.sum((predicted_classes == 0) & (true_classes == 1)) # False Fake (real predicted as fake)
fn = np.sum((predicted_classes == 1) & (true_classes == 0)) # False Real (fake predicted as real)

real_total = np.sum(true_classes == 1)
fake_total = np.sum(true_classes == 0)
total = len(true_classes)
correct = tp + tn
accuracy = correct / total

print("\n" + "=" * 80)
print("📊 COMPREHENSIVE PERFORMANCE RESULTS FOR PROCESSED IMAGES")
print("=" * 80)
print(f"  Total Images Tested     : {total}")
print(f"  Overall Accuracy        : {accuracy*100:.2f}% ({correct}/{total})")
print(f"  Real Detection Accuracy : {tn/real_total*100:.2f}% ({tn}/{real_total})")
print(f"  Fake Detection Accuracy : {tp/fake_total*100:.2f}% ({tp}/{fake_total})")
print(f"  False Fakes (Real -> Fake): {fp/real_total*100:.2f}% ({fp}/{real_total})")
print(f"  False Reals (Fake -> Real): {fn/fake_total*100:.2f}% ({fn}/{fake_total})")
print("=" * 80)

print("\n🔍 Confusion Matrix:")
print(f"{'':<12} | Predicted FAKE | Predicted REAL")
print(f"{'Actual FAKE':<12} | {tp:14d} | {fn:14d}")
print(f"{'Actual REAL':<12} | {fp:14d} | {tn:14d}")
print("=" * 80)
