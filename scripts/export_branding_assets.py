"""Export WodkaO app assets from branding kit (1254x1254)."""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "branding" / "a_clean_high_resolution_app_branding_icon_kit.png"
BRAND_BG = (180, 122, 53)  # #B47A35


def hex_rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))


def crop(src: Image.Image, x: int, y: int, w: int, h: int) -> Image.Image:
    return src.crop((x, y, x + w, y + h))


def resize(img: Image.Image, size: tuple[int, int]) -> Image.Image:
    return img.resize(size, Image.Resampling.LANCZOS)


def save_png(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if img.mode not in ("RGB", "RGBA"):
        img = img.convert("RGBA")
    img.save(path, "PNG", optimize=True)
    print(f"  {path.relative_to(ROOT)}  ({img.size[0]}x{img.size[1]})")


def icon_from_crop(src: Image.Image, box: tuple[int, int, int, int], out: Path, px: int) -> None:
    x, y, w, h = box
    save_png(resize(crop(src, x, y, w, h), (px, px)), out)


def splash_banner(src: Image.Image, box: tuple[int, int, int, int], out: Path) -> None:
    x, y, w, h = box
    banner = crop(src, x, y, w, h).convert("RGBA")
    canvas = Image.new("RGB", (1080, 240), BRAND_BG)
    scale = min(1080 / banner.width, 240 / banner.height)
    nw, nh = int(banner.width * scale), int(banner.height * scale)
    scaled = banner.resize((nw, nh), Image.Resampling.LANCZOS)
    ox = (1080 - nw) // 2
    oy = (240 - nh) // 2
    canvas.paste(scaled, (ox, oy), scaled if scaled.mode == "RGBA" else None)
    save_png(canvas, out)


def main() -> None:
    if not SOURCE.is_file():
        raise SystemExit(f"Missing source: {SOURCE}")

    src = Image.open(SOURCE).convert("RGBA")
    if src.size != (1254, 1254):
        print(f"Warning: expected 1254x1254, got {src.size[0]}x{src.size[1]}")

    icon_box = (65, 40, 520, 520)
    icon_from_crop(src, icon_box, ROOT / "assets" / "icon.png", 1024)
    icon_from_crop(src, icon_box, ROOT / "assets" / "adaptive-icon.png", 1024)
    splash_banner(src, (61, 1059, 546, 125), ROOT / "assets" / "splash.png")
    icon_from_crop(src, (674, 108, 220, 220), ROOT / "assets" / "web-icon.png", 512)

    ui_crops = [
        ((812, 780, 90, 90), "play-cards.png"),
        ((982, 773, 90, 90), "drink-bottle.png"),
        ((1110, 772, 90, 90), "trophy.png"),
        ((812, 944, 95, 80), "players.png"),
        ((976, 931, 90, 90), "settings.png"),
        ((1117, 931, 90, 90), "favorite.png"),
        ((809, 1078, 90, 90), "rules-beer.png"),
        ((975, 1077, 90, 90), "help.png"),
        ((1110, 1076, 90, 90), "exit.png"),
    ]
    for (x, y, w, h), name in ui_crops:
        save_png(crop(src, x, y, w, h), ROOT / "assets" / "ui" / name)

    print("Done.")


if __name__ == "__main__":
    main()
