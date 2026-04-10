# Training Instructions for DeepFake Detection MesoNet Model

This document explains how to train the MesoNet deepfake detection model using the provided training script `train.py`.

## Dataset Preparation

Prepare your dataset directory with the following structure:

```
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

- Place real (authentic) images in the `real/` folder.
- Place fake (deepfake) images in the `fake/` folder.

Make sure images are labeled correctly according to folders.

## Training the Model

Run the training script from the `inference/` directory:

```bash
python train.py --data_dir /path/to/dataset --epochs 10 --batch_size 32 --model_save_path mesonet_model.h5
```

- Replace `/path/to/dataset` with the actual path to your dataset directory.
- Adjust `--epochs` and `--batch_size` as required for your hardware and dataset size.
- The trained model weights will be saved as `mesonet_model.h5` by default.

## Using the Trained Model for Inference

- Copy or move the trained weights file (`mesonet_model.h5`) to your inference service directory.
- Modify `inference/main.py` to load the trained weights instead of the placeholder model if not already set.
- Restart the inference service.

## Additional Notes

- The training script uses data augmentation for robustness.
- TensorFlow 2.x with Keras API is required.
- GPU usage is recommended for faster training.

## Dependencies

Ensure you have installed all dependencies listed in `requirements.txt` including TensorFlow, OpenCV, Pillow, and FastAPI.

## Troubleshooting

- Check GPU availability if training is slow.
- Verify dataset image formats.
- Monitor loss and accuracy metrics for overfitting or underfitting.

For further assistance, refer to official TensorFlow and FastAPI documentation.
