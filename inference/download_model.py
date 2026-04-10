import hashlib
import os
import sys
import urllib.request


def _env(name: str, default: str = "") -> str:
    value = os.getenv(name, default)
    return value.strip() if isinstance(value, str) else value


def _sha256(path: str) -> str:
    hasher = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            hasher.update(chunk)
    return hasher.hexdigest()


def _download(url: str, destination: str) -> None:
    os.makedirs(os.path.dirname(destination), exist_ok=True)
    tmp_path = destination + ".tmp"
    with urllib.request.urlopen(url) as response, open(tmp_path, "wb") as out:
        out.write(response.read())
    os.replace(tmp_path, destination)


def main() -> int:
    base_dir = os.path.dirname(os.path.abspath(__file__))
    default_model_path = os.path.join(base_dir, "efficientnet_deepfake_final.h5")
    model_path_raw = _env("MODEL_PATH", default_model_path)
    model_path = model_path_raw if os.path.isabs(model_path_raw) else os.path.abspath(os.path.join(base_dir, model_path_raw))
    model_url = _env("MODEL_URL")
    expected_sha = _env("MODEL_SHA256").lower()

    if os.path.exists(model_path):
        if expected_sha:
            actual_sha = _sha256(model_path).lower()
            if actual_sha != expected_sha:
                print("ERROR: Existing model file hash mismatch.")
                print(f"Expected: {expected_sha}")
                print(f"Actual:   {actual_sha}")
                return 1
        print(f"Model ready: {model_path}")
        return 0

    if not model_url:
        print("ERROR: Trained model not found and MODEL_URL is not set.")
        print("Set MODEL_URL and MODEL_SHA256 in .env, then retry.")
        return 1

    print(f"Model missing, downloading from: {model_url}")
    try:
        _download(model_url, model_path)
    except Exception as exc:
        print(f"ERROR: Model download failed: {exc}")
        return 1

    if expected_sha:
        actual_sha = _sha256(model_path).lower()
        if actual_sha != expected_sha:
            print("ERROR: Downloaded model hash mismatch.")
            print(f"Expected: {expected_sha}")
            print(f"Actual:   {actual_sha}")
            return 1

    print(f"Model downloaded successfully: {model_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
