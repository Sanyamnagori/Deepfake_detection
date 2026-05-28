# Training Instructions for DeepFake Detection Models

This document explains how to train the deepfake detection models on new datasets using the provided training scripts.

We provide two distinct training pipelines depending on your accuracy and performance requirements:
1. **EfficientNet-B0 Model (`train_pro.py`)** — **[RECOMMENDED]** High-capacity transfer learning model with state-of-the-art accuracy.
2. **Enhanced MesoNet Model (`train_improved.py`)** — Lightweight, custom-built convolutional network designed for faster execution.

---

## 1. Dataset Preparation

Prepare your dataset directory with the following structure:

```text
dataset/
├── real/
│   ├── img1.jpg
│   ├── img2.jpg
│   └── ...
└── fake/
    ├── img1.jpg
    ├── img2.jpg
    └── ...
```

- **Important**: Your folders must be named exactly `real/` (authentic images/faces) and `fake/` (deepfake images/faces). The training pipelines will verify and assert this exact mapping (`fake` → 0, `real` → 1).
- **Face Extraction**: It is highly recommended to extract and crop faces from your videos/images first. You can use the `preprocess_faces.py` or `extract_frames_from_videos.py` utility scripts provided in this directory to do so automatically.

---

## 2. Training the Models

### Option A: Train the High-Accuracy EfficientNet-B0 Model (Recommended)

Run the advanced two-phase training pipeline (Warmup Phase + Fine-Tuning Phase with Cosine Decay):

```bash
python train_pro.py --data_dir ./dataset --epochs 50 --batch_size 32 --model_save_path efficientnet_deepfake_final.h5
```

- `--data_dir`: Path to your dataset directory.
- `--epochs`: Number of fine-tuning epochs (default: 50).
- `--batch_size`: Batch size for training (default: 32).
- `--model_save_path`: Output path for the best trained model (default: `efficientnet_deepfake_pro.h5`).

### Option A-Ultra: Train the Ultra-Robust EfficientNet-B0 Model (Highly Recommended for Wild/General Media)

The `train_ultra.py` script is highly optimized to fix common issues with early convergence, class imbalances, and Keras quantization mismatches.

To run it on Colab/GPU:
```bash
python train_ultra.py --data_dir ./dataset --epochs 45 --warmup 5 --batch_size 32 --patience 12 --model_save_path efficientnet_deepfake_ultra.h5
```

- `--data_dir`: Path to the extracted face frames dataset.
- `--epochs`: Number of backbone fine-tuning epochs (default: 40).
- `--warmup`: Number of frozen warmup epochs (default: 5). Guaranteed to complete.
- `--patience`: Early stopping patience for Phase 2 (default: 12).
- `--model_save_path`: Output path. Automatically formatted and repaired for Windows on save.

### Option B: Train the Lightweight Enhanced MesoNet Model

Run the custom convolutional neural network training pipeline:

```bash
python train_improved.py --data_dir ./dataset --epochs 50 --batch_size 32 --model_save_path enhanced_mesonet_optimized.h5
```

- `--data_dir`: Path to your dataset directory.
- `--epochs`: Number of training epochs (default: 50).
- `--batch_size`: Batch size (default: 32).
- `--model_save_path`: Output path for the best trained model (default: `enhanced_mesonet.h5`).

---

## 3. Deploying the Trained Model for Inference

Once training is complete, your best model will be saved as an `.h5` file. To deploy it to the FastAPI inference service:

1. Copy or move your trained model file into the `inference/` directory (e.g. name it `efficientnet_deepfake_final.h5` or `enhanced_mesonet_optimized.h5`).
2. Update the `MODEL_PATH` variable in your root `.env` file to point to your new model:
   ```env
   MODEL_PATH=./efficientnet_deepfake_final.h5
   ```
3. (Optional) If you are using the MesoNet model, ensure `ALLOW_MESONET_FALLBACK=true` is set in your `.env` file.
4. Restart the services. The FastAPI inference engine will automatically detect the architecture and load your trained weights.

---

## Dependencies & Requirements

Ensure you have installed all dependencies listed in `inference/requirements.txt`:
* TensorFlow 2.x
* OpenCV
* Pillow
* NumPy

```bash
pip install -r requirements.txt
```

> [!NOTE]
> GPU training is highly recommended for faster training, especially for the EfficientNet-B0 model. Ensure CUDA and cuDNN are correctly configured in your environment.
