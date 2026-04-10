from pathlib import Path
import cv2

base = Path('dataset')
classes = ['real', 'fake']

for cls in classes:
    folder = base / cls
    print(f'Class {cls}:')
    paths = sorted(folder.glob('*.jpg'))
    print(f'  Total images: {len(paths)}')
    for p in paths[:10]:
        img = cv2.imread(str(p))
        if img is None:
            print(f'  [ERROR] Cannot read {p.name}')
            continue
        h, w, c = img.shape
        print(f'  {p.name}: {w}x{h}, channels={c}')

print('\nChecking for non-image files:')
for cls in classes:
    folder = base / cls
    others = [p.name for p in folder.iterdir() if p.suffix.lower() not in ['.jpg', '.jpeg', '.png']]
    print(f'  {cls}: {others[:10]}')
