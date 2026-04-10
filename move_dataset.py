#!/usr/bin/env python3
"""
Script to move downloaded dataset to the project inference directory
"""
import os
import shutil
from pathlib import Path

def move_dataset():
    # Source: Downloads folder
    downloads_path = Path.home() / "Downloads"

    # Look for dataset folders (could be named differently)
    possible_names = ["dataset", "deepfake_dataset", "fake_real_dataset", "data"]

    source_fake = None
    source_real = None

    # First, look for separate fake and real folders
    fake_path = downloads_path / "fake"
    real_path = downloads_path / "real"

    if fake_path.exists() and real_path.exists():
        source_fake = fake_path
        source_real = real_path
        print("Found separate fake/ and real/ folders in Downloads")
    else:
        # Look for a main dataset folder
        for name in possible_names:
            dataset_path = downloads_path / name
            if dataset_path.exists():
                fake_in_dataset = dataset_path / "fake"
                real_in_dataset = dataset_path / "real"
                if fake_in_dataset.exists() and real_in_dataset.exists():
                    source_fake = fake_in_dataset
                    source_real = real_in_dataset
                    print(f"Found dataset in Downloads/{name}/")
                    break

    if not source_fake or not source_real:
        print("Could not find dataset with fake/ and real/ folders in Downloads")
        print("Please ensure your dataset has this structure:")
        print("Downloads/")
        print("  ├── fake/")
        print("  │   ├── image1.jpg")
        print("  │   └── ...")
        print("  └── real/")
        print("      ├── image1.jpg")
        print("      └── ...")
        return False

    # Destination
    dest_fake = Path("inference/dataset/fake")
    dest_real = Path("inference/dataset/real")

    # Create destination directories if they don't exist
    dest_fake.mkdir(parents=True, exist_ok=True)
    dest_real.mkdir(parents=True, exist_ok=True)

    print(f"Moving fake images from {source_fake} to {dest_fake}")
    print(f"Moving real images from {source_real} to {dest_real}")

    # Count files before moving
    fake_count_before = len(list(source_fake.glob("*")))
    real_count_before = len(list(source_real.glob("*")))

    print(f"Found {fake_count_before} fake images and {real_count_before} real images")

    # Move files (copy instead of move to be safe)
    fake_files = list(source_fake.glob("*"))
    real_files = list(source_real.glob("*"))

    moved_fake = 0
    moved_real = 0

    for file_path in fake_files:
        if file_path.is_file():
            shutil.copy2(file_path, dest_fake)
            moved_fake += 1

    for file_path in real_files:
        if file_path.is_file():
            shutil.copy2(file_path, dest_real)
            moved_real += 1

    print(f"Successfully moved {moved_fake} fake images and {moved_real} real images")
    print("Dataset integration complete!")

    return True

if __name__ == "__main__":
    move_dataset()
