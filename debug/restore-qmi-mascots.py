#!/usr/bin/env python3
"""큐미 마스코트 참조 이미지 복원 — 배경 투명화 + PNG/WebP 생성."""

from __future__ import annotations

import subprocess
from io import BytesIO
from pathlib import Path

from PIL import Image
from rembg import remove

ROOT = Path(__file__).resolve().parents[1]
ASSETS = Path('/Users/speeno/.cursor/projects/Users-speeno-AcademiPlatform/assets')
OUT_DIR = ROOT / 'frontend/public/mascot/qmi'

# 2026-06-13 04:02 배치 (최신 참조)
NEW_SOURCES = {
    'celebrate': 'ChatGPT_Image_2026____6____13_________04_02_27__1_-b9b1a1ed-1184-4cae-9022-1e2fade8f789.png',
    'thumbs-up': 'ChatGPT_Image_2026____6____13_________04_02_27__2_-6a2dae24-9f8c-4cad-a50a-839f7565ff89.png',
    'idle': 'ChatGPT_Image_2026____6____13_________04_02_27__3_-59ae156c-364b-4298-8c51-54326f7a3dc3.png',
    'greeting': 'ChatGPT_Image_2026____6____13_________04_02_27__4_-ab6c03f1-84ec-4409-a193-1c7793ec8495.png',
    'standing': 'ChatGPT_Image_2026____6____13_________04_02_28__5_-6cb32195-56e5-4b72-91a2-5a33788bea1f.png',
    'guiding': 'ChatGPT_Image_2026____6____13_________04_02_28__6_-d6a2436c-db8a-45fe-9bc1-92798e28c3ba.png',
    'presenting': 'ChatGPT_Image_2026____6____13_________04_02_28__7_-f306dc13-2a43-45bd-99f6-287dc849d7a4.png',
    'jumping': 'ChatGPT_Image_2026____6____13_________04_02_28__8_-386a3428-0adb-46c8-a702-36af3fc0c31e.png',
    'suit-standing': 'ChatGPT_Image_2026____6____13_________04_02_28__9_-c466e015-eaa1-4e46-bc39-16e10382842e.png',
    'graduate': 'ChatGPT_Image_2026____6____13_________04_02_30__10_-4b9066dc-ecb8-4af4-8a77-c2b0b773177a.png',
}

# 2026-06-13 04:07 배치 (의상 전용)
OUTFIT_SOURCES = {
    'expert-idle': 'ChatGPT_Image_2026____6____13_________04_07_40__1_-663baece-0435-4015-aae5-56f54fdc3feb.png',
    'expert-pointing': 'ChatGPT_Image_2026____6____13_________04_07_40__2_-a246b080-ef11-47c7-b591-3caf9c7797e5.png',
    'suit-idle': 'ChatGPT_Image_2026____6____13_________04_07_40__3_-73b884cb-d5bc-469f-93f7-317ce5ab4269.png',
    'graduate-gown': 'ChatGPT_Image_2026____6____13_________04_07_41__4_-0a6e9a72-6058-4986-8635-76bcdda4c207.png',
}

# 2026-06-13 03:59 배치 (신규 배치에 없는 포즈 보완)
LEGACY_SOURCES = {
    'waving': 'ChatGPT_Image_2026____6____13_________03_59_26__2_-00a48325-d22d-4067-a398-b38e1a3447ba.png',
    'pointing': 'ChatGPT_Image_2026____6____13_________03_59_26__3_-6c6c779c-8d2f-4988-b0cf-783656af537e.png',
    'idea': 'ChatGPT_Image_2026____6____13_________03_59_26__5_-27b80a48-3178-4894-962e-466c59f88ed6.png',
    'welcome': 'ChatGPT_Image_2026____6____13_________03_59_26__6_-41bf9da5-b0e2-4c95-826b-1df7cb838e0f.png',
    'surprised': 'ChatGPT_Image_2026____6____13_________03_59_26__8_-0b4c8e02-3bcf-4049-a98d-3ca8dcaa09f8.png',
    'explaining': 'ChatGPT_Image_2026____6____13_________03_59_27__9_-e7bf3ae3-7f43-4d87-abdd-39d813fbdcb1.png',
    'like': 'ChatGPT_Image_2026____6____13_________03_59_27__10_-2decf6d0-a55b-4832-b3c0-df4da751ffd8.png',
}

SOURCES = {**LEGACY_SOURCES, **NEW_SOURCES, **OUTFIT_SOURCES}

POSE_FROM_SOURCE: dict[str, str] = {
    'idle': 'idle',
    'standing': 'standing',
    'expert-idle': 'expert-idle',
    'suit-idle': 'suit-idle',
    'suit-standing': 'suit-standing',
    'waving': 'waving',
    'pointing': 'pointing',
    'guiding': 'guiding',
    'expert-pointing': 'expert-pointing',
    'thumbs-up': 'thumbs-up',
    'ok': 'thumbs-up',
    'idea': 'idea',
    'welcome': 'welcome',
    'greeting': 'greeting',
    'suit-greeting': 'greeting',
    'surprised': 'surprised',
    'excited': 'celebrate',
    'jumping': 'jumping',
    'explaining': 'explaining',
    'like': 'like',
    'cheer': 'celebrate',
    'celebrate': 'celebrate',
    'presenting': 'presenting',
    'graduate': 'graduate-gown',
}


def remove_background(src: Path) -> Image.Image:
    with src.open('rb') as f:
        data = remove(f.read())
    return Image.open(BytesIO(data)).convert('RGBA')


def trim_with_padding(img: Image.Image, pad: int = 24) -> Image.Image:
    bbox = img.getbbox()
    if not bbox:
        return img
    cropped = img.crop(bbox)
    w, h = cropped.size
    canvas = Image.new('RGBA', (w + pad * 2, h + pad * 2), (0, 0, 0, 0))
    canvas.paste(cropped, (pad, pad), cropped)
    return canvas


def save_webp(png_path: Path, webp_path: Path) -> None:
    subprocess.run(
        ['cwebp', '-q', '88', '-m', '6', str(png_path), '-o', str(webp_path)],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def make_avatar(source_img: Image.Image, out_png: Path, out_webp: Path) -> None:
    w, h = source_img.size
    crop = source_img.crop((int(w * 0.12), int(h * 0.02), int(w * 0.88), int(h * 0.58)))
    crop = trim_with_padding(crop, pad=16)
    side = max(crop.size)
    square = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    ox = (side - crop.size[0]) // 2
    oy = (side - crop.size[1]) // 2
    square.paste(crop, (ox, oy), crop)
    square = square.resize((256, 256), Image.Resampling.LANCZOS)
    square.save(out_png, optimize=True)
    save_webp(out_png, out_webp)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    needed_sources = set(POSE_FROM_SOURCE.values())
    processed: dict[str, Image.Image] = {}

    print('배경 제거 중...')
    for key in sorted(needed_sources):
        filename = SOURCES[key]
        src = ASSETS / filename
        if not src.exists():
            raise FileNotFoundError(f'참조 이미지 없음: {src}')
        img = remove_background(src)
        processed[key] = trim_with_padding(img)
        print(f'  ✓ {key}')

    print('포즈 파일 생성 중...')
    for pose, source_key in POSE_FROM_SOURCE.items():
        img = processed[source_key]
        png_path = OUT_DIR / f'qmi-{pose}.png'
        webp_path = OUT_DIR / f'qmi-{pose}.webp'
        img.save(png_path, optimize=True)
        save_webp(png_path, webp_path)
        print(f'  ✓ qmi-{pose}')

    avatar_png = OUT_DIR / 'qmi-avatar.png'
    avatar_webp = OUT_DIR / 'qmi-avatar.webp'
    make_avatar(processed['standing'], avatar_png, avatar_webp)
    print('  ✓ qmi-avatar')

    print(f'완료 — {len(POSE_FROM_SOURCE) + 1}개 파일 복원 ({OUT_DIR})')


if __name__ == '__main__':
    main()
