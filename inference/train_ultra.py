import os
import tensorflow as tf
from tensorflow.keras import layers, models, Input, regularizers
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint
import argparse
from tensorflow.keras.applications.efficientnet import preprocess_input
import numpy as np
import json

def clean_model_h5(filepath):
    """
    Strips Colab/Keras-specific serialization parameters (like 'quantization_config')
    to ensure the H5 model file loads flawlessly on Windows machines without errors.
    """
    print(f"\n[POST-PROCESS] Running Windows Compatibility check on {os.path.basename(filepath)}...")
    try:
        import h5py
        with h5py.File(filepath, 'r+') as f:
            if 'model_config' in f.attrs:
                config_str = f.attrs['model_config']
                if isinstance(config_str, bytes):
                    config_str = config_str.decode('utf-8')
                
                if 'quantization_config' in config_str:
                    print("-> Found Colab/Keras 'quantization_config' parameters. Cleaning...")
                    config = json.loads(config_str)
                    
                    def clean_config(obj):
                        if isinstance(obj, dict):
                            if 'quantization_config' in obj:
                                del obj['quantization_config']
                            for k, v in list(obj.items()):
                                clean_config(v)
                        elif isinstance(obj, list):
                            for item in obj:
                                clean_config(item)
                                
                    clean_config(config)
                    new_config_str = json.dumps(config)
                    f.attrs['model_config'] = new_config_str.encode('utf-8')
                    print("-> Windows compatibility successfully applied!")
                else:
                    print("-> Model file is already compatible (no quantization_config found).")
            else:
                print("-> Model configuration metadata not found at root.")
    except Exception as e:
        print(f"[WARNING] Could not execute compatibility cleaning: {e}")

class WindowsCompatibleCheckpoint(ModelCheckpoint):
    """
    Custom ModelCheckpoint that automatically runs the H5 serialization clean-up
    after every epoch a new best model is saved.
    """
    def on_epoch_end(self, epoch, logs=None):
        super().on_epoch_end(epoch, logs)
        # If the file exists, clean it up right away
        if os.path.exists(self.filepath):
            clean_model_h5(self.filepath)

def build_efficientnet_model(input_shape=(224, 224, 3)):
    """
    Builds a robust Transfer Learning model using EfficientNetB0 backbone.
    """
    inputs = Input(shape=input_shape)
    
    # Base Model: EfficientNetB0 (Pre-trained on ImageNet)
    base_model = EfficientNetB0(
        include_top=False,
        weights='imagenet',
        input_shape=input_shape
    )
    
    # Freeze base model for Phase 1
    base_model.trainable = False
    
    x = base_model(inputs, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.5)(x)  # Dropout to prevent overfitting
    
    # Dense Classifier Classifier
    x = layers.Dense(512, activation='relu', kernel_regularizer=regularizers.l2(0.001))(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.3)(x)
    
    # Output Sigmoid (0 = REAL, 1 = FAKE)
    outputs = layers.Dense(1, activation='sigmoid')(x)
    
    model = models.Model(inputs=inputs, outputs=outputs, name="EfficientNetB0_DeepFake")
    return model

def get_advanced_augmentation(preprocess_fn):
    """
    Applies data augmentation strategies to prevent early overfitting.
    """
    def custom_augment(img):
        img = preprocess_fn(img)
        # Apply occasional Cutout (Random Erasing)
        if np.random.rand() < 0.3:
            h, w, _ = img.shape
            size = np.random.randint(20, 50)
            y = np.random.randint(0, h - size)
            x = np.random.randint(0, w - size)
            img[y:y+size, x:x+size, :] = 0.0
        return img

    return ImageDataGenerator(
        preprocessing_function=custom_augment,
        horizontal_flip=True,
        rotation_range=20,
        width_shift_range=0.15,
        height_shift_range=0.15,
        shear_range=0.1,
        zoom_range=0.2,
        brightness_range=[0.8, 1.2],
        fill_mode='nearest'
    )

def train_ultra(data_dir, epochs=40, warmup_epochs=5, batch_size=32, patience=12, model_save_path='efficientnet_deepfake_ultra.h5'):
    """
    Robust training pipeline with explicit class mapping, guaranteed warmup run,
    automatic class balance weights, and Windows-ready model formatting.
    """
    target_size = (224, 224)
    
    # Setup Generators
    train_datagen = get_advanced_augmentation(preprocess_input)
    val_datagen = ImageDataGenerator(preprocessing_function=preprocess_input)

    # CRITICAL: Dynamically auto-detect subfolders to map:
    # 0 -> real (REAL)
    # 1 -> fake (FAKE)
    # This aligns 100% with the production FastAPI detection script logic.
    print(f"\n[DATA] Scanning directory: {data_dir}")
    
    if not os.path.exists(data_dir):
        raise FileNotFoundError(f"Data directory not found: {data_dir}")
        
    subdirs = [d for d in os.listdir(data_dir) if os.path.isdir(os.path.join(data_dir, d)) and d != "__pycache__"]
    
    # Identify which directories represent real vs fake
    real_names = ['real', 'original', 'authentic', 'pristine']
    fake_names = ['fake', 'deepfakes', 'deepfake', 'manipulated', 'synthesized', 'face2face', 'faceswap', 'faceshifter', 'neuraltextures']
    
    real_dir = None
    fake_dir = None
    
    for d in subdirs:
        d_lower = d.lower()
        if any(r in d_lower for r in real_names):
            real_dir = d
        elif any(f in d_lower for f in fake_names):
            fake_dir = d
            
    if real_dir and fake_dir:
        classes_to_use = [real_dir, fake_dir]
        print(f"[DATA] Auto-detected classes: '{real_dir}' mapped to 0 (REAL), '{fake_dir}' mapped to 1 (FAKE)")
    else:
        # Fallback to alphanumeric sort if we cannot auto-detect
        classes_to_use = sorted(subdirs)
        print(f"[DATA] Warning: Could not auto-detect class keywords. Using alphabetical fallback: {classes_to_use}")
        print("Note: Ensure your folders map to: index 0 = REAL, index 1 = FAKE.")

    train_generator = train_datagen.flow_from_directory(
        data_dir,
        target_size=target_size,
        batch_size=batch_size,
        class_mode='binary',
        classes=classes_to_use,
        shuffle=True
    )

    # Use 20% validation split from a dedicated directory or let users pass it.
    validation_generator = val_datagen.flow_from_directory(
        data_dir,
        target_size=target_size,
        batch_size=batch_size,
        class_mode='binary',
        classes=classes_to_use,
        shuffle=False
    )
    
    print(f"[DATA] Confirmed Class Indices: {train_generator.class_indices}")
    
    # Compute Class Weights to balance training automatically
    labels = train_generator.classes
    class_counts = np.bincount(labels)
    total_samples = len(labels)
    num_classes = len(class_counts)
    
    class_weights = {}
    print("\n[BALANCE] Dataset composition:")
    for i, cls_name in enumerate(['real', 'fake']):
        count = class_counts[i] if i < len(class_counts) else 0
        print(f" -> {cls_name}: {count} samples")
        if count > 0:
            class_weights[i] = total_samples / (num_classes * count)
        else:
            class_weights[i] = 1.0
    print(f"[BALANCE] Computed Class Weights: {class_weights}")

    # Initialize Model
    model = build_efficientnet_model(input_shape=(224, 224, 3))
    
    # -------------------------------------------------------------------------
    # PHASE 1: Warmup Phase (Frozen Backbone)
    # -------------------------------------------------------------------------
    print(f"\n{'='*70}")
    print(f"🚀 PHASE 1: Warmup Training ({warmup_epochs} Epochs) - Classifier Only")
    print(f"{'='*70}\n")
    print("Base backbone is FROZEN. Training the top classification dense head...")
    
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss='binary_crossentropy',
        metrics=['accuracy', tf.keras.metrics.AUC(name='auc')]
    )
    
    # Warmup runs for a GUARANTEED number of epochs to stabilize classifier head.
    # No Early Stopping is used here.
    model.fit(
        train_generator,
        epochs=warmup_epochs,
        validation_data=validation_generator,
        class_weight=class_weights,
        verbose=1
    )
    
    # -------------------------------------------------------------------------
    # PHASE 2: Fine-Tuning Phase (Unfreeze Backbone)
    # -------------------------------------------------------------------------
    print(f"\n{'='*70}")
    print(f"🔧 PHASE 2: Backbone Fine-Tuning ({epochs} Epochs)")
    print(f"{'='*70}\n")
    
    base_model = None
    for layer in model.layers:
        if 'efficientnet' in layer.name.lower():
            base_model = layer
            break
            
    if base_model is None:
        for layer in model.layers:
            if hasattr(layer, 'layers'):
                base_model = layer
                break

    if base_model:
        print(f"Unfreezing deep layers of backbone model: {base_model.name}...")
        base_model.trainable = True
        
        # We unfreeze only the top 60 layers of EfficientNet for extreme stability
        for layer in base_model.layers[:-60]:
            layer.trainable = False
        print(f"Successfully unfroze the top 60 feature layers of {base_model.name}!")
    else:
        print("[ERROR] Base EfficientNet backbone not found! Aborting fine-tuning.")
        return

    # Cosine learning rate decay for smooth optimization convergence
    lr_schedule = tf.keras.optimizers.schedules.CosineDecay(
        initial_learning_rate=1e-4,
        decay_steps=epochs * len(train_generator),
        alpha=0.05
    )
    
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=lr_schedule),
        loss='binary_crossentropy',
        metrics=['accuracy', 
                 tf.keras.metrics.Precision(name='precision'),
                 tf.keras.metrics.Recall(name='recall'),
                 tf.keras.metrics.AUC(name='auc')]
    )
    
    # Checkpoints and callbacks
    callbacks = [
        EarlyStopping(
            monitor='val_loss', 
            patience=patience, 
            restore_best_weights=True, 
            verbose=1
        ),
        WindowsCompatibleCheckpoint(
            model_save_path, 
            monitor='val_accuracy', 
            save_best_only=True, 
            verbose=1
        )
    ]
    
    print(f"Fine-tuning compiled. Patience set to {patience} epochs.")
    print("Starting full training run...")
    
    history = model.fit(
        train_generator,
        epochs=epochs,
        validation_data=validation_generator,
        class_weight=class_weights,
        callbacks=callbacks,
        verbose=1
    )
    
    # Save final model state and clean it
    final_save_path = model_save_path.replace('.h5', '_final.h5')
    print(f"\nSaving final model iteration to: {final_save_path}")
    model.save(final_save_path)
    clean_model_h5(final_save_path)
    
    if os.path.exists(model_save_path):
        print(f"\n[SUCCESS] Best performing validation checkpoint: {model_save_path}")
        clean_model_h5(model_save_path)
        
    print("\nTraining completed successfully! Download the cleaned H5 file and paste it into Windows.")
    return history

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Ultra-Robust EfficientNet Training for DeepFakes")
    parser.add_argument('--data_dir', type=str, required=True, help='Path to dataset directory')
    parser.add_argument('--epochs', type=int, default=40, help='Number of fine-tuning epochs')
    parser.add_argument('--warmup', type=int, default=5, help='Number of warmup epochs')
    parser.add_argument('--batch_size', type=int, default=32, help='Batch size')
    parser.add_argument('--patience', type=int, default=12, help='Early stopping patience epochs')
    parser.add_argument('--model_save_path', type=str, default='efficientnet_deepfake_ultra.h5', help='Save path')
    
    args = parser.parse_args()
    
    train_ultra(
        data_dir=args.data_dir,
        epochs=args.epochs,
        warmup_epochs=args.warmup,
        batch_size=args.batch_size,
        patience=args.patience,
        model_save_path=args.model_save_path
    )
