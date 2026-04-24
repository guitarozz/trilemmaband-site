#!/bin/sh

set -eu

python3 <<'PY'
import json
from pathlib import Path

images_dir = Path("images")
manifest_json_path = images_dir / "gallery-manifest.json"
manifest_js_path = images_dir / "gallery-manifest.js"
allowed_ext = {".jpg", ".jpeg", ".png", ".webp", ".gif"}

def make_label(file_path: Path) -> str:
    name = file_path.stem.replace("-", " ").replace("_", " ").strip()
    return " ".join(part.capitalize() for part in name.split()) or "TriLemma photo"

files = sorted(
    [p for p in images_dir.iterdir() if p.is_file() and p.suffix.lower() in allowed_ext],
    key=lambda p: p.name.lower(),
)

images = []
for file_path in files:
    label = make_label(file_path)
    images.append(
        {
            "src": f"images/{file_path.name}",
            "alt": f"TriLemma photo - {label}",
            "caption": label,
        }
    )

manifest = {"images": images}
manifest_json = json.dumps(manifest, indent=2) + "\n"
manifest_json_path.write_text(manifest_json, encoding="utf-8")

manifest_js = "window.GALLERY_MANIFEST = " + json.dumps(manifest, indent=2) + ";\n"
manifest_js_path.write_text(manifest_js, encoding="utf-8")

print(f"Wrote {manifest_json_path} and {manifest_js_path} with {len(images)} image(s).")
PY
