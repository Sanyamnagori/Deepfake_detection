import os
import tensorflow as tf
import numpy as np
import argparse
from tensorflow.keras.applications.efficientnet import preprocess_input

def evaluate_model(model_path, data_dir):
    """Evaluate the trained model on test data."""

    print(f"Loading model from: {model_path}")
    try:
        model = tf.keras.models.load_model(model_path)
    except Exception as e:
        print(f"Error loading model: {e}")
        return

    # Create test data generator
    # MUST MATCH TRAINING PREPROCESSING: No rescale, use preprocess_input
    test_datagen = tf.keras.preprocessing.image.ImageDataGenerator(
        preprocessing_function=preprocess_input,
        validation_split=0.2 
    )

    # Use the validation subset for evaluation
    test_generator = test_datagen.flow_from_directory(
        data_dir,
        target_size=(224, 224), 
        batch_size=32,
        class_mode='binary',
        subset='validation', 
        shuffle=False 
    )

    print(f"\nEvaluating on {test_generator.samples} images (Validation Set)...")
    
    # Verify class indices
    print(f"Class indices: {test_generator.class_indices}")

    # Get predictions
    predictions = model.predict(test_generator, verbose=1)
    
    # CRITICAL: flow_from_directory assigns labels ALPHABETICALLY:
    #   'fake' (0) 
    #   'real' (1)
    # Sigmoid output >= 0.5 means 'real' (1)
    predicted_classes = (predictions >= 0.5).astype(int).flatten()

    # Get true labels
    true_classes = test_generator.classes

    # Calculate metrics using numpy
    accuracy = np.mean(predicted_classes == true_classes)
    
    # Confusion Matrix
    tp = np.sum((predicted_classes == 1) & (true_classes == 1)) # True Real
    tn = np.sum((predicted_classes == 0) & (true_classes == 0)) # True Fake
    fp = np.sum((predicted_classes == 1) & (true_classes == 0)) # False Real (Fake predicted as Real)
    fn = np.sum((predicted_classes == 0) & (true_classes == 1)) # False Fake (Real predicted as Fake)
    
    print(f"\n📊 Accuracy: {accuracy:.4f} ({accuracy*100:.2f}%)")
    
    print("\n🔍 Confusion Matrix:")
    print(f"{'':<12} | Predicted Real | Predicted Fake")
    print(f"{'Actual Real':<12} | {tp:14d} | {fn:14d}")
    print(f"{'Actual Fake':<12} | {fp:14d} | {tn:14d}")

    # Per-class accuracy
    real_total = tp + fn
    fake_total = tn + fp
    
    if real_total > 0:
        real_acc = tp / real_total
        print(f"Real Detection Accuracy: {real_acc:.4f} ({real_acc*100:.2f}%)")
    
    if fake_total > 0:
        fake_acc = tn / fake_total
        print(f"Fake Detection Accuracy: {fake_acc:.4f} ({fake_acc*100:.2f}%)")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Evaluate EfficientNet DeepFake Model")
    parser.add_argument('--model_path', type=str, default='efficientnet_deepfake_final.h5', help='Path to model file')
    parser.add_argument('--data_dir', type=str, default='dataset', help='Path to dataset directory')
    
    args = parser.parse_args()
    evaluate_model(args.model_path, args.data_dir)
