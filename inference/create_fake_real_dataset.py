import os
import shutil
import urllib.request

def download_image(url, save_path):
    try:
        urllib.request.urlretrieve(url, save_path)
        print(f"Downloaded {url} to {save_path}")
    except Exception as e:
        print(f"Failed to download {url}: {e}")

def setup_dataset(base_dir='dataset'):
    real_dir = os.path.join(base_dir, 'real')
    fake_dir = os.path.join(base_dir, 'fake')

    os.makedirs(real_dir, exist_ok=True)
    os.makedirs(fake_dir, exist_ok=True)

    # Example real images (licensed, royalty-free sources recommended)
    real_images = [
        "https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d",
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
    ]

    # Example fake deepfake-like images (for illustration, use altered or generated images)
    fake_images = [
        "https://upload.wikimedia.org/wikipedia/commons/1/17/Deepfake_example_faceswap.jpg",
        "https://cdn.vox-cdn.com/thumbor/7t2cj5oOfXa2vK-sptnZs67rqqk=/0x0:5120x2880/1200x800/filters:focal(2156x1072:2964x1880)/cdn.vox-cdn.com/uploads/chorus_image/image/70235868/deepfake_07.0.png"
    ]

    print("Downloading real images...")
    for idx, url in enumerate(real_images):
        save_path = os.path.join(real_dir, f"real_{idx+1}.jpg")
        download_image(url, save_path)

    print("Downloading fake images...")
    for idx, url in enumerate(fake_images):
        save_path = os.path.join(fake_dir, f"fake_{idx+1}.jpg")
        download_image(url, save_path)

    print(f"Dataset prepared in {base_dir}/ with 'real' and 'fake' subfolders.")

if __name__ == '__main__':
    setup_dataset()
