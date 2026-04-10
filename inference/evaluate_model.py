import os
import tensorflow as tf
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns

def evaluate_model(model_path, data_dir):
    """Evaluate the trained model on test data."""

    print(f"Loading model from: {model_path}")
    model = tf.keras.models.load_model(model_path)

    # Create test data generator (no augmentation for evaluation)
    test_datagen = tf.keras.preprocessing.image.ImageDataGenerator(rescale=1./255)

    test_generator = test_datagen.flow_from_directory(
        data_dir,
        target_size=(256, 256),
        batch_size=32,
        class_mode='binary',
        shuffle=False  # Important for evaluation
    )

    print(f"\nEvaluating on {test_generator.samples} images...")

    # Get predictions
    predictions = model.predict(test_generator, verbose=1)
    predicted_classes = (predictions > 0.5).astype(int).flatten()

    # Get true labels
    true_classes = test_generator.classes

    # Calculate metrics
    accuracy = np.mean(predicted_classes == true_classes)
    precision = np.sum((predicted_classes == 1) & (true_classes == 1)) / np.sum(predicted_classes == 1)
    recall = np.sum((predicted_classes == 1) & (true_classes == 1)) / np.sum(true_classes == 1)
    f1_score = 2 * (precision * recall) / (precision + recall)

    print("
📊 Model Performance Metrics:"    print(f"Accuracy: {accuracy:.4f} ({accuracy*100:.2f}%)")
    print(f"Precision: {precision:.4f} ({precision*100:.2f}%)")
    print(f"Recall: {recall:.4f} ({recall*100:.2f}%)")
    print(f"F1-Score: {f1_score:.4f} ({f1_score*100:.2f}%)")

    # Detailed classification report
    print("
📋 Detailed Classification Report:"    print(classification_report(true_classes, predicted_classes,
                         target_names=['Real', 'Fake']))

    # Confusion matrix
    cm = confusion_matrix(true_classes, predicted_classes)
    print("
🔍 Confusion Matrix:"    print("Predicted | Real | Fake")
    print(f"Real      | {cm[0][0]:4d} | {cm[0][1]:4d}")
    print(f"Fake      | {cm[1][0]:4d} | {cm[1][1]:4d}")

    # Calculate per-class accuracy
    real_accuracy = cm[0][0] / (cm[0][0] + cm[0][1])
    fake_accuracy = cm[1][1] / (cm[1][0] + cm[1][1])

    print("
🎯 Per-Class Accuracy:"    print(f"Real Detection Accuracy: {real_accuracy:.4f} ({real_accuracy*100:.2f}%)")
    print(f"Fake Detection Accuracy: {fake_accuracy:.4f} ({fake_accuracy*100:.2f}%)")

    return {
        'accuracy': accuracy,
        'precision': precision,
        'recall': recall,
        'f1_score': f1_score,
        'real_accuracy': real_accuracy,
        'fake_accuracy': fake_accuracy
    }

if __name__ == '__main__':
    # Evaluate the current model
    model_path = 'enhanced_mesonet_optimized.h5'
    data_dir = 'dataset'  # Assuming dataset is in inference/dataset

    if os.path.exists(model_path) and os.path.exists(data_dir):
        metrics = evaluate_model(model_path, data_dir)
    else:
        print(f"Model file {model_path} or data directory {data_dir} not found!")
        print(f"Model exists: {os.path.exists(model_path)}")
        print(f"Data exists: {os.path.exists(data_dir)}")
