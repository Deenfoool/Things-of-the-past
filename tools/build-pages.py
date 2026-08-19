#!/usr/bin/env python3
from __future__ import annotations

import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "_site"

RUNTIME_SUFFIXES = {".html", ".js", ".css"}
RUNTIME_FILES = {".nojekyll"}

PRODUCTION_UNUSED = {
    "assets/characters/lyublino-market/market-worker-seated-spritesheet.png",
    "assets/locations/lyublino-market/director-office/02-desk.png",
    "assets/locations/lyublino-market/director-office/04-incident-area.png",
}

OLD_PRELOAD_BLOCK = """for (const room of Object.values(rooms)) {
  for (const scene of room.scenes) {
    const sources = new Set([scene.src, ...Object.values(scene.contentVariants || {})]);
    sources.forEach(src => {
      const image = new Image();
      image.src = src;
    });
  }
}
"""

NEW_PRELOAD_BLOCK = """const preloadedSceneSources = new Set();

function preloadSceneAssets(scene) {
  if (!scene) return;
  const sources = new Set([scene.src, ...Object.values(scene.contentVariants || {})]);
  sources.forEach(src => {
    if (!src || preloadedSceneSources.has(src)) return;
    preloadedSceneSources.add(src);
    const image = new Image();
    image.decoding = 'async';
    image.src = src;
  });
}

function preloadRoomAssets(roomId) {
  const room = rooms[roomId];
  if (!room) return;
  room.scenes.forEach(preloadSceneAssets);
}
"""

CURRENT_INDEX_MARKER = """if (!Number.isInteger(currentIndex) || currentIndex < 0 || currentIndex >= rooms[currentRoomId].scenes.length) currentIndex = 0;
"""

TRANSITION_MARKER = """function transitionTo(roomId, index, direction) {
  const targetRoom = rooms[roomId];
"""

TRANSITION_REPLACEMENT = """function transitionTo(roomId, index, direction) {
  preloadRoomAssets(roomId);
  const targetRoom = rooms[roomId];
"""


def human_size(value: int) -> str:
    size = float(value)
    for unit in ("B", "KB", "MB", "GB"):
        if size < 1024 or unit == "GB":
            return f"{size:.1f} {unit}"
        size /= 1024
    return f"{size:.1f} GB"


def copy_runtime() -> None:
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)

    for path in ROOT.iterdir():
        if path.is_file() and (path.suffix in RUNTIME_SUFFIXES or path.name in RUNTIME_FILES):
            shutil.copy2(path, OUT / path.name)

    shutil.copytree(ROOT / "assets", OUT / "assets")

    for relative in PRODUCTION_UNUSED:
        target = OUT / relative
        if target.exists():
            target.unlink()


def patch_runtime_text() -> None:
    for path in OUT.rglob("*"):
        if not path.is_file() or path.suffix not in RUNTIME_SUFFIXES:
            continue
        text = path.read_text(encoding="utf-8")
        text = text.replace(".png", ".webp")
        path.write_text(text, encoding="utf-8")

    app = OUT / "app.js"
    text = app.read_text(encoding="utf-8")

    if OLD_PRELOAD_BLOCK in text:
        text = text.replace(OLD_PRELOAD_BLOCK, NEW_PRELOAD_BLOCK, 1)
    elif "function preloadRoomAssets(roomId)" not in text:
        raise RuntimeError("Could not find the global image preload block in app.js")

    preload_current = CURRENT_INDEX_MARKER + "\npreloadRoomAssets(currentRoomId);\n"
    if "preloadRoomAssets(currentRoomId);" not in text:
        if CURRENT_INDEX_MARKER not in text:
            raise RuntimeError("Could not find current room initialization in app.js")
        text = text.replace(CURRENT_INDEX_MARKER, preload_current, 1)

    if TRANSITION_REPLACEMENT not in text:
        if TRANSITION_MARKER not in text:
            raise RuntimeError("Could not find transitionTo in app.js")
        text = text.replace(TRANSITION_MARKER, TRANSITION_REPLACEMENT, 1)

    app.write_text(text, encoding="utf-8")


def convert_pngs() -> tuple[int, int, int]:
    pngs = sorted((OUT / "assets").rglob("*.png"))
    original_bytes = sum(path.stat().st_size for path in pngs)
    webp_bytes = 0

    for png in pngs:
        webp = png.with_suffix(".webp")
        is_character = "/characters/" in png.as_posix()
        quality = "90" if is_character else "82"

        command = [
            "cwebp",
            "-quiet",
            "-mt",
            "-m", "6",
            "-q", quality,
            "-metadata", "none",
        ]
        if is_character:
            command += ["-alpha_q", "100"]
        else:
            command += ["-af"]
        command += [str(png), "-o", str(webp)]

        subprocess.run(command, check=True)
        webp_bytes += webp.stat().st_size
        png.unlink()

    return len(pngs), original_bytes, webp_bytes


def validate() -> None:
    leftover_pngs = list((OUT / "assets").rglob("*.png"))
    if leftover_pngs:
        raise RuntimeError(f"PNG files left in production assets: {leftover_pngs[:3]}")

    bad_refs: list[str] = []
    for path in OUT.rglob("*"):
        if not path.is_file() or path.suffix not in RUNTIME_SUFFIXES:
            continue
        text = path.read_text(encoding="utf-8")
        if ".png" in text:
            bad_refs.append(str(path.relative_to(OUT)))
    if bad_refs:
        raise RuntimeError(f"PNG references left in runtime files: {bad_refs}")

    app_text = (OUT / "app.js").read_text(encoding="utf-8")
    if "for (const room of Object.values(rooms))" in app_text:
        raise RuntimeError("Production app.js still preloads every room")
    if "preloadRoomAssets(currentRoomId);" not in app_text:
        raise RuntimeError("Production app.js does not preload the current room")
    if "preloadRoomAssets(roomId);" not in app_text:
        raise RuntimeError("Production app.js does not preload target rooms")


def main() -> None:
    copy_runtime()
    patch_runtime_text()
    count, before, after = convert_pngs()
    validate()

    saving = before - after
    ratio = (after / before * 100) if before else 0
    print(f"Optimized {count} PNG images")
    print(f"Images before: {human_size(before)}")
    print(f"Images after:  {human_size(after)}")
    print(f"Saved:         {human_size(saving)} ({100 - ratio:.1f}% smaller)")
    print("Production preload: current/target room only")


if __name__ == "__main__":
    main()
