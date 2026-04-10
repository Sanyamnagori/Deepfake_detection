import os
import tensorflow as tf
from tensorflow.keras import layers, models, Input, regularizers
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, LearningRateScheduler
import argparse
from tensorflow.keras.applications.efficientnet import preprocess_input
import numpy as np

def build_efficientnet_model(input_shape=(224, 224, 3)):
    """
    Builds a Transfer Learning model using EfficientNetB0.
    """
    inputs = Input(shape=input_shape)
    
    # Base Model: EfficientNetB0 (Pre-trained on ImageNet)
    base_model = EfficientNetB0(
        include_top=False,
        weights='imagenet',
        input_tensor=inputs
    )
    
    # Freeze the base model initially (Phase 1)
    base_model.trainable = False
    
    # Rebuild top layers
    x = base_model.output
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.5)(x)  # Strong dropout for regularization
    
    # Dense Classifier
    x = layers.Dense(512, activation='relu', kernel_regularizer=regularizers.l2(0.001))(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.3)(x)
    
    outputs = layers.Dense(1, activation='sigmoid')(x)
    
    model = models.Model(inputs=inputs, outputs=outputs, name="EfficientNetB0_DeepFake")
    return model

def get_advanced_augmentation(preprocess_fn):
    """
    Creates an ImageDataGenerator with advanced augmentation.
    Note: ColorJitter and RandomErasing are partially simulated via standard params
    or could be added via a custom preprocessing function.
    """
    def custom_augment(img):
        # Apply standard preprocessing first
        img = preprocess_fn(img)
        
        # Simple Random Erasing (Cutout) implementation
        if np.random.rand() < 0.3: # 30% chance
            h, w, _ = img.shape
            size = np.random.randint(20, 50)
            y = np.random.randint(0, h - size)
            x = np.random.randint(0, w - size)
            img[y:y+size, x:x+size, :] = 0
            
        return img

    return ImageDataGenerator(
        preprocessing_function=custom_augment,
        validation_split=0.2,
        horizontal_flip=True,
        rotation_range=30,
        width_shift_range=0.2,
        height_shift_range=0.2,
        shear_range=0.15,
        zoom_range=0.25,
        brightness_range=[0.7, 1.3],
        fill_mode='nearest'
    )

def train_pro(data_dir, epochs=50, batch_size=32, model_save_path='efficientnet_deepfake.h5'):
    """
    Trains the model using a two-phase strategy with enhanced accuracy features.
    """
    target_size = (224, 224)
    
    # Data Augmentation (Advanced)
    train_datagen = get_advanced_augmentation(preprocess_input)

    val_datagen = ImageDataGenerator(
        preprocessing_function=preprocess_input,
        validation_split=0.2
    )

    print(f"\nLoading data from {data_dir}...")
    
    train_generator = train_datagen.flow_from_directory(
        data_dir,
        target_size=target_size,
        batch_size=batch_size,
        class_mode='binary',
        subset='training',
        shuffle=True
    )

    validation_generator = val_datagen.flow_from_directory(
        data_dir,
        target_size=target_size,
        batch_size=batch_size,
        class_mode='binary',
        subset='validation',
        shuffle=False
    )
    
    print(f"Class Indices: {train_generator.class_indices}")
    
    # ---------------------------------------------------------
    # Phase 1: Warmup (Train Classifier Only)
    # ---------------------------------------------------------
    print(f"\n{'='*50}")
    print("PHASE 1: Warmup Training (Frozen Base)")
    print(f"{'='*50}\n")
    
    model = build_efficientnet_model(input_shape=(224, 224, 3))
    
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss='binary_crossentropy',
        metrics=['accuracy', tf.keras.metrics.AUC(name='auc')]
    )
    
    warmup_epochs = 5
    model.fit(
        train_generator,
        epochs=warmup_epochs,
        validation_data=validation_generator,
        callbacks=[EarlyStopping(monitor='val_loss', patience=2, restore_best_weights=True)],
        verbose=1
    )
    
    # ---------------------------------------------------------
    # Phase 2: Fine-tuning (Deeper Unfreeze + CosineDecay)
    # ---------------------------------------------------------
    print(f"\n{'='*50}")
    print("PHASE 2: Fine-Tuning (Deeper Unfreeze)")
    print(f"{'='*50}\n")
    
    # Find the base model (EfficientNet backbone)
    base_model = None
    for layer in model.layers:
        if 'efficientnet' in layer.name.lower():
            base_model = layer
            break
            
    if base_model is None:
        print("Warning: Could not find EfficientNet backbone by name. Using layer indexing as fallback.")
        # Fallback to searching for a layer with 'layers' attribute
        for layer in model.layers:
            if hasattr(layer, 'layers'):
                base_model = layer
                break

    if base_model:
        print(f"Unfreezing {base_model.name}...")
        base_model.trainable = True
        
        # Fine-tune only the top 50 layers for stability
        # Total layers are around 237
        for layer in base_model.layers[:-50]:
            layer.trainable = False
    else:
        print("Error: Could not find base model to unfreeze!")
        return
        
    # Cosine Decay Learning Rate Schedule
    lr_schedule = tf.keras.optimizers.schedules.CosineDecay(
        initial_learning_rate=1e-4,
        decay_steps=epochs * len(train_generator),
        alpha=0.1 # Minimum LR is 10% of initial
    )
    
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=lr_schedule),
        loss='binary_crossentropy',
        metrics=['accuracy', 
                 tf.keras.metrics.Precision(name='precision'),
                 tf.keras.metrics.Recall(name='recall'),
                 tf.keras.metrics.AUC(name='auc')]
    )
    
    print("Model re-compiled with CosineDecay and deeper unfreeze. Starting full training...")
    
    callbacks = [
        EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True, verbose=1),
        ModelCheckpoint(model_save_path, monitor='val_accuracy', save_best_only=True, verbose=1)
    ]
    
    history = model.fit(
        train_generator,
        epochs=epochs,
        validation_data=validation_generator,
        callbacks=callbacks,
        verbose=1
    )
    
    print(f"\n✅ Training complete! Best model saved to: {model_save_path}")
    return history

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Train Improved EfficientNetB0 for DeepFake Detection")
    parser.add_argument('--data_dir', type=str, required=True, help='Path to dataset directory')
    parser.add_argument('--epochs', type=int, default=50, help='Number of epochs')
    parser.add_argument('--batch_size', type=int, default=32, help='Batch size')
    parser.add_argument('--model_save_path', type=str, default='efficientnet_deepfake_pro.h5', help='Save path')
    
    args = parser.parse_args()
    
    train_pro(args.data_dir, args.epochs, args.batch_size, args.model_save_path)
