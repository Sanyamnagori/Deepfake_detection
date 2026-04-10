import os
import cv2
import numpy as np
from tqdm import tqdm
import argparse

def crop_faces(data_dir, output_dir, padding=0.2):
    """
    Detects faces using OpenCV Haar Cascades and crops them with optional padding.
    """
    # Initialize OpenCV Haar Cascade for face detection
    face_cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    face_cascade = cv2.CascadeClassifier(face_cascade_path)
    
    if face_cascade.empty():
        print("Error: Could not load Haar Cascade XML file.")
        return

    classes = ['real', 'fake']
    
    for cls in classes:
        input_class_dir = os.path.join(data_dir, cls)
        output_class_dir = os.path.join(output_dir, cls)
        
        if not os.path.exists(input_class_dir):
            print(f"Warning: Input directory {input_class_dir} not found. Skipping.")
            continue
            
        os.makedirs(output_class_dir, exist_ok=True)
        
        image_files = [f for f in os.listdir(input_class_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
        
        print(f"Processing {len(image_files)} images in '{cls}' folder...")
        
        success_count = 0
        for filename in tqdm(image_files):
            img_path = os.path.join(input_class_dir, filename)
            output_path = os.path.join(output_class_dir, filename)
            
            # Read image
            img = cv2.imread(img_path)
            if img is None:
                continue
                
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Detect faces
            faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
            
            if len(faces) > 0:
                # Take the largest face (usually the most prominent one)
                faces = sorted(faces, key=lambda x: x[2] * x[3], reverse=True)
                (x, y, w, h) = faces[0]
                
                # Apply padding
                pad_w = int(w * padding)
                pad_h = int(h * padding)
                
                img_h, img_w, _ = img.shape
                
                x1 = max(0, x - pad_w)
                y1 = max(0, y - pad_h)
                x2 = min(img_w, x + w + pad_w)
                y2 = min(img_h, y + h + pad_h)
                
                # Crop face
                face_img = img[y1:y2, x1:x2]
                
                # Save cropped face
                cv2.imwrite(output_path, face_img)
                success_count += 1
            else:
                # If no face detected, we save the original to keep the dataset size consistent
                cv2.imwrite(output_path, img)

        print(f"Successfully cropped {success_count}/{len(image_files)} faces in '{cls}'.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Crop faces from DeepFake dataset using OpenCV")
    parser.add_argument('--data_dir', type=str, default='dataset', help='Path to the dataset directory')
    parser.add_argument('--output_dir', type=str, default='dataset_processed', help='Path to save processed images')
    parser.add_argument('--padding', type=float, default=0.2, help='Padding around the face (default: 0.2)')
    
    args = parser.parse_args()
    
    crop_faces(args.data_dir, args.output_dir, args.padding)
