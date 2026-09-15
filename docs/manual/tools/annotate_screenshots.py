"""Draws the numbered markers straight into the manual screenshots (img/ -> img/annotated/).

Why: markers drawn as HTML elements over a screenshot were rendered by the iOS/Safari PDF viewer with grey
blocks behind them, even without shadows. Baked into the bitmap, each figure is a single opaque image and
nothing is composited over it. The screenshots are flattened over white (the figure background) and saved
as RGB PNG at their original size, so the image carries no transparency either.

Marker positions come from tools/markers.json, in pixels of the original screenshot: `center` of the disc
and `label_origin` (left end of the number's baseline). Style (sizes in mm on the page, colours) is in the
same file; `px_per_mm` is the scale at which each screenshot is printed in the manual.

Usage (from the repository root):
    python docs/manual/tools/annotate_screenshots.py
Requires Pillow and fontTools with brotli (`pip install pillow fonttools brotli`).
"""
import io
import json
from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from PIL import Image, ImageDraw, ImageFont, PngImagePlugin

MANUAL = Path(__file__).resolve().parent.parent
SUPERSAMPLE = 8  # markers are drawn 8x larger and box-averaged down: exact edge coverage
PT_TO_MM = 25.4 / 72


def rgb(hex_color: str):
    return tuple(int(hex_color[i:i + 2], 16) for i in (1, 3, 5))


def label_font(weight: int, size_px: float) -> ImageFont.FreeTypeFont:
    """Schibsted Grotesk from fonts/, instanced at the weight used by the manual."""
    font = TTFont(MANUAL / "fonts" / "SchibstedGrotesk-latin.woff2")
    font = instantiateVariableFont(font, {"wght": weight})
    font.flavor = None
    data = io.BytesIO()
    font.save(data)
    data.seek(0)
    return ImageFont.truetype(data, size=round(size_px), layout_engine=ImageFont.Layout.BASIC)


def draw_marker(image: Image.Image, marker: dict, style: dict, scale: tuple, font: ImageFont.FreeTypeFont):
    sx, sy = scale
    cx, cy = marker["center"]
    ring_r = (style["disc_mm"] / 2 + style["ring_mm"]) * max(sx, sy)
    pad = 2
    x0, y0 = int(cx - ring_r) - pad, int(cy - ring_r) - pad
    x1, y1 = int(cx + ring_r) + pad + 1, int(cy + ring_r) + pad + 1
    box = (max(x0, 0), max(y0, 0), min(x1, image.width), min(y1, image.height))
    w, h = box[2] - box[0], box[3] - box[1]
    S = SUPERSAMPLE

    def to_ss(x, y):  # image px -> supersampled patch px
        return (x - box[0]) * S, (y - box[1]) * S

    def ellipse_mask(radius_mm):
        mask = Image.new("L", (w * S, h * S), 0)
        px, py = to_ss(cx, cy)
        rx, ry = radius_mm * sx * S, radius_mm * sy * S
        ImageDraw.Draw(mask).ellipse((px - rx, py - ry, px + rx, py + ry), fill=255)
        return mask.reduce(S)

    ring = ellipse_mask(style["disc_mm"] / 2 + style["ring_mm"])
    disc = ellipse_mask(style["disc_mm"] / 2)
    label = Image.new("L", (w * S, h * S), 0)
    ox, oy = to_ss(*marker["label_origin"])
    ImageDraw.Draw(label).text((ox, oy), str(marker["n"]), font=font, fill=255, anchor="ls")
    label = label.reduce(S)

    patch = image.crop(box)
    for color, mask in ((style["ring"], ring), (style["disc"], disc), (style["label"], label)):
        patch.paste(Image.new("RGB", patch.size, rgb(color)), (0, 0), mask)
    image.paste(patch, box[:2])


def main():
    config = json.loads((Path(__file__).with_name("markers.json")).read_text(encoding="utf-8"))
    style = config["style"]
    out_dir = MANUAL / "img" / "annotated"
    out_dir.mkdir(exist_ok=True)
    fonts = {}
    for figure in config["figures"]:
        src = Image.open(MANUAL / "img" / figure["image"])
        flat = Image.new("RGB", src.size, rgb(style["background"]))
        flat.paste(src.convert("RGBA"), (0, 0), src.convert("RGBA"))
        scale = tuple(figure["px_per_mm"])
        size_px = style["font_pt"] * PT_TO_MM * scale[1] * SUPERSAMPLE
        key = round(size_px)
        if key not in fonts:
            fonts[key] = label_font(style["font_weight"], size_px)
        for marker in figure["markers"]:
            draw_marker(flat, marker, style, scale, fonts[key])
        info = PngImagePlugin.PngInfo()
        if "srgb" in src.info:
            info.add(b"sRGB", bytes([src.info["srgb"]]))
        if "gamma" in src.info:
            info.add(b"gAMA", round(src.info["gamma"] * 100000).to_bytes(4, "big"))
        flat.save(out_dir / figure["image"], pnginfo=info, dpi=src.info.get("dpi", (96, 96)), optimize=True)
        print(f"{figure['image']}: {len(figure['markers'])} markers -> img/annotated/{figure['image']}")


if __name__ == "__main__":
    main()
