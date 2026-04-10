import os
import tensorflow as tf
from tensorflow.keras import layers, models, Input, regularizers
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau
import argparse

def build_enhanced_mesonet(input_shape=(256, 256, 3)):
    """Build enhanced MesoNet with deeper architecture and regularization."""

    inputs = Input(shape=input_shape)

    # Initial convolution
    x = layers.Conv2D(32, (3, 3), padding="same", use_bias=False)(inputs)
    x = layers.BatchNormalization()(x)
    x = layers.ReLU()(x)
    x = layers.MaxPooling2D((2, 2))(x)

    # Block 1 - Deeper with residual-like connection
    x = layers.Conv2D(64, (3, 3), padding="same", use_bias=False)(x)
    x = layers.BatchNormalization()(x)
    x = layers.ReLU()(x)
    x = layers.Conv2D(64, (3, 3), padding="same", use_bias=False)(x)
    x = layers.BatchNormalization()(x)
    x = layers.ReLU()(x)
    x = layers.MaxPooling2D((2, 2))(x)
    x = layers.Dropout(0.25)(x)

    # Block 2
    x = layers.Conv2D(128, (3, 3), padding="same", use_bias=False)(x)
    x = layers.BatchNormalization()(x)
    x = layers.ReLU()(x)
    x = layers.Conv2D(128, (3, 3), padding="same", use_bias=False)(x)
    x = layers.BatchNormalization()(x)
    x = layers.ReLU()(x)
    x = layers.MaxPooling2D((2, 2))(x)
    x = layers.Dropout(0.25)(x)

    # Block 3
    x = layers.Conv2D(256, (3, 3), padding="same", use_bias=False)(x)
    x = layers.BatchNormalization()(x)
    x = layers.ReLU()(x)
    x = layers.Conv2D(256, (3, 3), padding="same", use_bias=False)(x)
    x = layers.BatchNormalization()(x)
    x = layers.ReLU()(x)
    x = layers.MaxPooling2D((2, 2))(x)
    x = layers.Dropout(0.25)(x)

    # Block 4
    x = layers.Conv2D(512, (3, 3), padding="same", use_bias=False)(x)
    x = layers.BatchNormalization()(x)
    x = layers.ReLU()(x)
    x = layers.Conv2D(512, (3, 3), padding="same", use_bias=False)(x)
    x = layers.BatchNormalization()(x)
    x = layers.ReLU()(x)
    x = layers.MaxPooling2D((2, 2))(x)
    x = layers.Dropout(0.25)(x)

    # Global average pooling + classifier with regularization
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dense(512, activation="relu", kernel_regularizer=regularizers.l2(0.001))(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.5)(x)
    x = layers.Dense(256, activation="relu", kernel_regularizer=regularizers.l2(0.001))(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.3)(x)
    outputs = layers.Dense(1, activation="sigmoid")(x)

    model = models.Model(inputs=inputs, outputs=outputs, name="enhanced_mesonet")
    return model

def train_enhanced(data_dir, epochs=50, batch_size=32, model_save_path='enhanced_mesonet.h5'):
    """Train enhanced MesoNet with advanced techniques."""

    # Training data: Enhanced augmentation (NO vertical flip - creates unnatural upside-down faces)
    train_datagen = ImageDataGenerator(
        rescale=1./255,
        validation_split=0.2,
        horizontal_flip=True,
        # vertical_flip=True,  # REMOVED - creates unnatural upside-down faces
        zoom_range=0.15,  # Reduced from 0.2
        rotation_range=15,  # Reduced from 20
        width_shift_range=0.15,  # Reduced from 0.2
        height_shift_range=0.15,  # Reduced from 0.2
        shear_range=0.1,  # Reduced from 0.2
        brightness_range=[0.85, 1.15],  # Narrowed from [0.8, 1.2]
        fill_mode='nearest'
    )

    # Validation data: NO augmentation, only rescale
    val_datagen = ImageDataGenerator(
        rescale=1./255,
        validation_split=0.2
    )

    train_generator = train_datagen.flow_from_directory(
        data_dir,
        target_size=(256, 256),
        batch_size=batch_size,
        class_mode='binary',
        subset='training',
        shuffle=True
    )

    validation_generator = val_datagen.flow_from_directory(
        data_dir,
        target_size=(256, 256),
        batch_size=batch_size,
        class_mode='binary',
        subset='validation',
        shuffle=False
    )
    
    # CRITICAL: Verify and log class indices
    print(f"\n{'='*70}")
    print(f"CLASS INDICES VERIFICATION")
    print(f"{'='*70}")
    print(f"Training class indices: {train_generator.class_indices}")
    print(f"Validation class indices: {validation_generator.class_indices}")
    
    # Assert correct mapping
    expected_mapping = {'fake': 0, 'real': 1}
    assert train_generator.class_indices == expected_mapping, \
        f"Unexpected class mapping! Expected {expected_mapping}, got {train_generator.class_indices}"
    assert train_generator.class_indices == validation_generator.class_indices, \
        "Train and validation class indices don't match!"
    
    print(f"✅ Label mapping verified: 'fake' → 0, 'real' → 1")
    print(f"{'='*70}\n")

    # Build and compile model
    model = build_enhanced_mesonet()

    # Lower learning rate for more stable training
    optimizer = tf.keras.optimizers.Adam(learning_rate=1e-4)  # Reduced from 1e-3
    model.compile(
        optimizer=optimizer,
        loss='binary_crossentropy',
        metrics=['accuracy',
                tf.keras.metrics.Precision(name='precision'),
                tf.keras.metrics.Recall(name='recall'),
                tf.keras.metrics.AUC(name='auc')]
    )

    print("Enhanced MesoNet Architecture:")
    model.summary()

    # Training callbacks
    early_stopping = EarlyStopping(
        monitor='val_loss',
        patience=7,  # Reduced from 10 - stop earlier if not improving
        restore_best_weights=True,
        verbose=1
    )

    model_checkpoint = ModelCheckpoint(
        model_save_path,
        monitor='val_accuracy',
        save_best_only=True,
        verbose=1
    )

    reduce_lr = ReduceLROnPlateau(
        monitor='val_loss',
        factor=0.2,  # Reduced from 0.5 - more aggressive reduction
        patience=3,  # Reduced from 5 - reduce sooner
        min_lr=1e-7,
        verbose=1
    )

    # Train the model
    history = model.fit(
        train_generator,
        epochs=epochs,
        validation_data=validation_generator,
        callbacks=[early_stopping, model_checkpoint, reduce_lr],
        verbose=1
    )

    print(f"Enhanced model saved to {model_save_path}")
    return history

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Train enhanced MesoNet model")
    parser.add_argument('--data_dir', type=str, required=True,
                        help='Path to dataset directory with subfolders real/ and fake/')
    parser.add_argument('--epochs', type=int, default=50,
                        help='Number of epochs for training')
    parser.add_argument('--batch_size', type=int, default=32,
                        help='Batch size for training')
    parser.add_argument('--model_save_path', type=str, default='enhanced_mesonet.h5',
                        help='Path to save the trained model')
    args = parser.parse_args()

    train_enhanced(args.data_dir, args.epochs, args.batch_size, args.model_save_path)
