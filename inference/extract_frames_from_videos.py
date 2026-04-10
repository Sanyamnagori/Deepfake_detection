import os
import cv2

VIDEO_BASE_DIR = "videos"      # where your videos are
OUTPUT_BASE_DIR = "dataset"    # where images for training go
CLASSES = ["real", "fake"]     # subfolder names for classes
FRAME_INTERVAL = 10             # take 1 frame every N frames
MAX_FRAMES_PER_VIDEO = 200      # safety cap; set None for all frames
FACE_TARGET_SIZE = (256, 256)   # size of cropped face images

# Use OpenCV's built-in Haar cascade for face detection
CASCADE_PATH = os.path.join(cv2.data.haarcascades, "haarcascade_frontalface_default.xml")
FACE_CASCADE = cv2.CascadeClassifier(CASCADE_PATH)
if FACE_CASCADE.empty():
    print(f"[WARN] Could not load face cascade from {CASCADE_PATH}. "
          "Frames will be saved without face cropping.")

def ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)


def detect_and_crop_face(frame):
    """Detect the largest face and return a cropped, resized face image.

    Returns None if no face is detected or if the cascade is unavailable.
    """
    if FACE_CASCADE.empty():
        return None

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = FACE_CASCADE.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(60, 60),
    )

    if len(faces) == 0:
        return None

    # Choose the largest detected face (by area)
    x, y, w, h = max(faces, key=lambda f: f[2] * f[3])

    # Add a small margin around the face
    margin = int(0.2 * max(w, h))
    x0 = max(x - margin, 0)
    y0 = max(y - margin, 0)
    x1 = min(x + w + margin, frame.shape[1])
    y1 = min(y + h + margin, frame.shape[0])

    face_crop = frame[y0:y1, x0:x1]
    if face_crop.size == 0:
        return None

    face_resized = cv2.resize(face_crop, FACE_TARGET_SIZE)
    return face_resized


def extract_frames_from_video(video_path: str, output_dir: str,
                              frame_interval: int = FRAME_INTERVAL,
                              max_frames_per_video: int | None = MAX_FRAMES_PER_VIDEO) -> None:
    """Extract frames from a single video into output_dir.

    Attempts to detect and crop faces before saving. If no face is found in a
    selected frame, that frame is skipped.
    """
    ensure_dir(output_dir)
    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        print(f"[WARN] Cannot open video: {video_path}")
        return

    frame_count = 0
    saved_count = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if frame_count % frame_interval == 0:
            # Try to detect and crop a face from this frame
            face_img = detect_and_crop_face(frame)
            if face_img is None:
                frame_count += 1
                continue

            filename = f"{os.path.splitext(os.path.basename(video_path))[0]}_frame_{frame_count}.jpg"
            save_path = os.path.join(output_dir, filename)
            cv2.imwrite(save_path, face_img)
            saved_count += 1

            if max_frames_per_video is not None and saved_count >= max_frames_per_video:
                break

        frame_count += 1

    cap.release()
    print(f"[INFO] {video_path}: saved {saved_count} frames to {output_dir}")


def main() -> None:
    for cls in CLASSES:
        video_dir = os.path.join(VIDEO_BASE_DIR, cls)
        output_dir = os.path.join(OUTPUT_BASE_DIR, cls)

        if not os.path.isdir(video_dir):
            print(f"[WARN] Skipping class '{cls}', no folder: {video_dir}")
            continue

        ensure_dir(output_dir)

        for filename in os.listdir(video_dir):
            if not filename.lower().endswith((".mp4", ".avi", ".mov", ".mkv")):
                continue

            video_path = os.path.join(video_dir, filename)
            extract_frames_from_video(video_path, output_dir)


if __name__ == "__main__":
    main()
