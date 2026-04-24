#!/bin/sh

set -eu

python3 <<'PY'
import json
import re
import subprocess
from pathlib import Path

images_dir = Path("images")
manifest_json_path = images_dir / "gallery-manifest.json"
manifest_js_path = images_dir / "gallery-manifest.js"
allowed_ext = {".jpg", ".jpeg", ".png", ".webp", ".gif"}

dimension_pattern = re.compile(r"pixel(Width|Height):\s*(\d+)")

def make_label(file_path: Path) -> str:
    name = file_path.stem.replace("-", " ").replace("_", " ").strip()
    return " ".join(part.capitalize() for part in name.split()) or "TriLemma photo"


def detect_orientation(file_path: Path) -> str:
    try:
        result = subprocess.run(
            ["sips", "-g", "pixelWidth", "-g", "pixelHeight", str(file_path)],
            check=True,
            capture_output=True,
            text=True,
        )

        width = None
        height = None
        for line in result.stdout.splitlines():
            match = dimension_pattern.search(line)
            if not match:
                continue

            axis = match.group(1)
            value = int(match.group(2))
            if axis == "Width":
                width = value
            elif axis == "Height":
                height = value

        if not width or not height:
            return "unknown"
        if height > width:
            return "portrait"
        if width > height:
            return "landscape"
        return "square"
    except Exception:
        return "unknown"

files = sorted(
    [p for p in images_dir.iterdir() if p.is_file() and p.suffix.lower() in allowed_ext],
    key=lambda p: p.name.lower(),
)

images = []
for file_path in files:
    label = make_label(file_path)
    orientation = detect_orientation(file_path)
    images.append(
        {
            "src": f"images/{file_path.name}",
            "alt": f"TriLemma photo - {label}",
            "caption": label,
            "orientation": orientation,
        }
    )

manifest = {"images": images}
manifest_json = json.dumps(manifest, indent=2) + "\n"
manifest_json_path.write_text(manifest_json, encoding="utf-8")

manifest_js = "window.GALLERY_MANIFEST = " + json.dumps(manifest, indent=2) + ";\n"
manifest_js_path.write_text(manifest_js, encoding="utf-8")

print(f"Wrote {manifest_json_path} and {manifest_js_path} with {len(images)} image(s).")
PY
