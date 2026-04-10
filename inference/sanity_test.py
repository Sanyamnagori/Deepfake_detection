"""
Sanity test: Overfit on 100 samples to verify model CAN learn.
If this test fails, there's a fundamental problem with the architecture.
"""
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import numpy as np
import os
import sys

# Import model builder
from train_improved import build_enhanced_mesonet

def sanity_test(data_dir='dataset', num_samples=100, epochs=50):
    """Train on tiny dataset and verify near-100% accuracy."""
    
    print("=" * 70)
    print("SANITY TEST: Overfit on Small Batch")
    print("=" * 70)
    print(f"\nObjective: Verify model CAN learn by overfitting on {num_samples} samples")
    print(f"Expected: Final accuracy >= 95%")
    print(f"If this fails, there's a fundamental architecture problem\n")
    
    if not os.path.exists(data_dir):
        print(f"❌ ERROR: Dataset directory not found: {data_dir}")
        sys.exit(1)
    
    # Load small batch
    datagen = ImageDataGenerator(rescale=1./255)
    gen = datagen.flow_from_directory(
        data_dir,
        target_size=(256, 256),
        batch_size=num_samples,
        class_mode='binary',
        shuffle=True
    )
    
    # Get one batch
    print(f"Loading {num_samples} random samples...")
    X, y = next(gen)
    
    actual_samples = len(y)
    class_counts = np.bincount(y.astype(int))
    
    print(f"✅ Loaded {actual_samples} samples")
    print(f"   Class 0 (fake): {class_counts[0]} samples")
    print(f"   Class 1 (real): {class_counts[1]} samples")
    
    # Build model
    print(f"\nBuilding model...")
    model = build_enhanced_mesonet()
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss='binary_crossentropy',
        metrics=['accuracy']
    )
    
    print(f"Model parameters: {model.count_params():,}")
    
    # Train on same batch repeatedly
    print(f"\n{'='*70}")
    print(f"Training on same {actual_samples} samples for {epochs} epochs...")
    print(f"(Model should memorize these samples and reach ~100% accuracy)")
    print(f"{'='*70}\n")
    
    history = model.fit(
        X, y,
        epochs=epochs,
        batch_size=32,
        verbose=1
    )
    
    # Evaluate
    final_acc = history.history['accuracy'][-1]
    final_loss = history.history['loss'][-1]
    
    print(f"\n{'='*70}")
    print(f"RESULTS")
    print(f"{'='*70}")
    print(f"Final training accuracy: {final_acc:.4f} ({final_acc*100:.2f}%)")
    print(f"Final training loss: {final_loss:.4f}")
    
    # Verdict
    print(f"\n{'='*70}")
    if final_acc >= 0.95:
        print(f"✅ PASS: Model CAN learn (accuracy >= 95%)")
        print(f"   The architecture is capable of learning patterns")
        print(f"   If full training fails, check:")
        print(f"   - Label mapping (run verify_setup.py)")
        print(f"   - Data quality")
        print(f"   - Hyperparameters")
        exit_code = 0
    elif final_acc >= 0.80:
        print(f"⚠️  WARN: Model learning is weak (80-95%)")
        print(f"   Model can learn but struggles to memorize")
        print(f"   Consider:")
        print(f"   - Reducing model complexity")
        print(f"   - Increasing learning rate")
        print(f"   - Checking for bugs in architecture")
        exit_code = 1
    else:
        print(f"❌ FAIL: Model CANNOT learn (accuracy < 80%)")
        print(f"   This indicates a fundamental architecture problem:")
        print(f"   - Model may be too simple/complex")
        print(f"   - Activation functions may be wrong")
        print(f"   - Loss function may be incompatible")
        print(f"   - Label mapping may be broken")
        exit_code = 2
    
    print(f"{'='*70}\n")
    
    return final_acc, exit_code

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description="Sanity test for model")
    parser.add_argument('--data_dir', type=str, default='dataset',
                       help='Path to dataset directory')
    parser.add_argument('--num_samples', type=int, default=100,
                       help='Number of samples to overfit on')
    parser.add_argument('--epochs', type=int, default=50,
                       help='Number of epochs to train')
    args = parser.parse_args()
    
    final_acc, exit_code = sanity_test(args.data_dir, args.num_samples, args.epochs)
    sys.exit(exit_code)
