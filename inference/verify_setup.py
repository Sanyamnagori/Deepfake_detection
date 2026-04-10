"""
Verify training setup before running expensive training.
CRITICAL: Run this BEFORE training to catch label mapping issues.
"""
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import os
import sys

def verify_labels(data_dir='dataset'):
    """Verify label mapping is correct."""
    
    if not os.path.exists(data_dir):
        print(f"❌ ERROR: Dataset directory not found: {data_dir}")
        sys.exit(1)
    
    print("=" * 70)
    print("LABEL MAPPING VERIFICATION")
    print("=" * 70)
    
    datagen = ImageDataGenerator(rescale=1./255)
    
    try:
        gen = datagen.flow_from_directory(
            data_dir,
            target_size=(256, 256),
            batch_size=32,
            class_mode='binary',
            shuffle=False
        )
    except Exception as e:
        print(f"❌ ERROR: Failed to load dataset: {e}")
        sys.exit(1)
    
    print(f"\n📁 Dataset directory: {data_dir}")
    print(f"📊 Total samples: {gen.samples}")
    print(f"📂 Number of classes: {gen.num_classes}")
    print(f"\n🔍 Class Indices Mapping:")
    print(f"   {gen.class_indices}")
    
    print(f"\n📋 Expected mapping for binary classification:")
    print(f"   'fake' → 0 (first alphabetically)")
    print(f"   'real' → 1 (second alphabetically)")
    
    # Verify mapping
    expected_mapping = {'fake': 0, 'real': 1}
    
    if gen.class_indices == expected_mapping:
        print(f"\n✅ PASS: Label mapping is CORRECT")
        print(f"   Model will learn: output 0 = fake, output 1 = real")
    else:
        print(f"\n❌ FAIL: Unexpected label mapping!")
        print(f"   Expected: {expected_mapping}")
        print(f"   Got: {gen.class_indices}")
        print(f"\n⚠️  This will cause the model to learn inverted labels!")
        sys.exit(1)
    
    # Sample distribution
    print(f"\n📊 Class distribution:")
    for folder_name, label_value in gen.class_indices.items():
        folder_path = os.path.join(data_dir, folder_name)
        if os.path.exists(folder_path):
            count = len([f for f in os.listdir(folder_path) 
                        if f.lower().endswith(('.jpg', '.jpeg', '.png'))])
            print(f"   {folder_name} (label {label_value}): {count} images")
    
    print("\n" + "=" * 70)
    print("✅ Verification complete. Safe to proceed with training.")
    print("=" * 70)
    
    return gen.class_indices

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description="Verify dataset label mapping")
    parser.add_argument('--data_dir', type=str, default='dataset',
                       help='Path to dataset directory')
    args = parser.parse_args()
    
    verify_labels(args.data_dir)
