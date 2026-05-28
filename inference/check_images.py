import cv2
import os

base_dir = os.path.dirname(os.path.abspath(__file__))
project_dir = os.path.abspath(os.path.join(base_dir, ".."))

def check_images():
    frames_dir = os.path.join(project_dir, "Frames(cropped+aligned)")
    if not os.path.exists(frames_dir):
        print("Frames dir not found")
        return
        
    subfolders = ["Original", "Deepfakes", "Face2Face", "FaceShifter", "FaceSwap", "NeuralTextures"]
    
    for folder in subfolders:
        folder_path = os.path.join(frames_dir, folder)
        if not os.path.exists(folder_path):
            print(f"Folder not found: {folder}")
            continue
            
        files = [f for f in os.listdir(folder_path) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        if not files:
            print(f"No images in {folder}")
            continue
            
        img_path = os.path.join(folder_path, files[0])
        img = cv2.imread(img_path)
        if img is None:
            print(f"Failed to read image in {folder}")
            continue
            
        print(f"Folder: {folder}")
        print(f"  First Image: {files[0]}")
        print(f"  Shape      : {img.shape}")
        print(f"  Min Pixel  : {img.min()}")
        print(f"  Max Pixel  : {img.max()}")
        print("-" * 50)

if __name__ == '__main__':
    check_images()
